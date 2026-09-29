-- =============================================================================
-- MIGRACIÓN: Sistema de Notificaciones de Negocio — GestiCasa
-- Versión: 20260929000000
--
-- FILOSOFÍA: Esta migración NO contiene triggers ni lógica de pg_net
-- adicionales. Los eventos se reciben vía triggers SQL ya desplegados que
-- utilizan pg_net. El motor único es la Edge Function process-push-event.
-- Esta migración solo crea:
--   1. El campo created_by_role en issues para notificaciones dirigidas.
--   2. La tabla notification_logs (idempotencia).
--   3. Una función auxiliar de Vault para que pg_cron invoque la Edge
--      Function check-debt-notifications sin guardar la clave en texto plano.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. CAMPO DE AUTORÍA EN INCIDENCIAS
-- Necesario para identificar quién creó la incidencia y no enviarle el push.
-- -----------------------------------------------------------------------------
alter table public.issues
  add column if not exists created_by_role text
  check (created_by_role in ('propietario', 'inquilino'));

-- -----------------------------------------------------------------------------
-- 0.1. TRIGGER DE AUTORÍA AUTOMÁTICA
-- Garantiza de forma inmutable en backend que created_by_role corresponda
-- al rol real (en 'profiles') del usuario autenticado que realiza el INSERT.
-- -----------------------------------------------------------------------------
create or replace function public.set_issue_creator_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  -- Obtener el rol real del usuario autenticado desde la tabla profiles
  select role into v_role 
  from public.profiles 
  where id = auth.uid();
  
  -- Si el usuario tiene rol, forzarlo en el INSERT (ignorando el input del cliente)
  if v_role in ('propietario', 'inquilino') then
    new.created_by_role := v_role;
  end if;
  
  return new;
end;
$$;

-- Revocar permisos de ejecución a public para evitar invocaciones directas
revoke execute on function public.set_issue_creator_role() from public;

drop trigger if exists trg_set_issue_creator_role on public.issues;
create trigger trg_set_issue_creator_role
  before insert on public.issues
  for each row
  execute function public.set_issue_creator_role();

-- -----------------------------------------------------------------------------
-- 1. TABLA notification_logs
-- Fuente única de verdad para idempotencia.
-- SOLO se escribe desde process-push-event (motor central).
-- RLS bloqueada para usuarios directos. Solo service_role accede.
-- -----------------------------------------------------------------------------
create table if not exists public.notification_logs (
  id                uuid    default gen_random_uuid() primary key,
  idempotency_key   text    not null unique,
  recipient_user_id uuid    references auth.users(id) on delete cascade not null,
  event_type        text    not null,
  status            text    not null default 'sent',  -- 'sent' | 'skipped' | 'failed'
  created_at        timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índice para búsquedas rápidas de idempotencia
create index if not exists idx_notification_logs_key
  on public.notification_logs (idempotency_key);

-- Índice para limpieza futura de logs antiguos
create index if not exists idx_notification_logs_created_at
  on public.notification_logs (created_at);

-- RLS: Ningún usuario autenticado accede a esta tabla directamente.
-- process-push-event usa service_role que no está sujeto a RLS.
alter table public.notification_logs enable row level security;

create policy "notification_logs_no_user_access"
  on public.notification_logs for all
  using (false);

-- -----------------------------------------------------------------------------
-- 2. FUNCIÓN: gcasa_invoke_debt_check
-- Wrapper seguro para pg_cron que lee la service_role_key desde Vault
-- y llama a la Edge Function check-debt-notifications via pg_net.
--
-- PREREQUISITO MANUAL (una sola vez desde el panel de Supabase → Vault):
--   1. En el panel de Supabase, ir a Settings → Vault.
--   2. Crear un secreto llamado exactamente: 'gcasa_service_role_key'
--      con el valor de tu service_role key del proyecto.
--   3. Crear un secreto llamado: 'gcasa_supabase_url'
--      con el valor de tu URL del proyecto (ej: https://XXXX.supabase.co).
--
-- Este mecanismo garantiza que la clave nunca esté en texto plano
-- en la configuración de PostgreSQL ni en el repositorio Git.
-- -----------------------------------------------------------------------------
create or replace function public.gcasa_invoke_debt_check()
returns void
language plpgsql
security definer
as $$
declare
  v_url     text;
  v_key     text;
  v_webhook text;
begin
  -- Leer URL del proyecto desde Vault
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'gcasa_supabase_url'
  limit 1;

  -- Leer service_role_key desde Vault
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'gcasa_service_role_key'
  limit 1;

  -- Leer webhook secret desde Vault (mismo que configura process-push-event)
  select decrypted_secret into v_webhook
  from vault.decrypted_secrets
  where name = 'gcasa_webhook_secret'
  limit 1;

  if v_url is null or v_key is null then
    raise warning '[GCASA_CRON] Vault secrets no configurados. Omitiendo check de deuda.';
    return;
  end if;

  -- Llamar a check-debt-notifications vía pg_net (asíncrono)
  perform net.http_post(
    url     := v_url || '/functions/v1/check-debt-notifications',
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
      'Authorization',   'Bearer ' || v_key,
      'x-webhook-secret', coalesce(v_webhook, '')
    ),
    body    := '{}'::jsonb
  );

exception when others then
  raise warning '[GCASA_CRON] Error invocando check-debt-notifications: %', sqlerrm;
end;
$$;

-- =============================================================================
-- CONFIGURACIÓN MANUAL NECESARIA DESPUÉS DE APLICAR ESTA MIGRACIÓN:
--
-- A) SUPABASE VAULT (Settings → Vault → New secret):
--    • gcasa_supabase_url     → 'https://TU_PROJECT_ID.supabase.co'
--    • gcasa_service_role_key → 'TU_SERVICE_ROLE_KEY'
--    • gcasa_webhook_secret   → 'un_string_secreto_aleatorio' (ej: uuidgen)
--
-- B) EDGE FUNCTION SECRETS (Settings → Edge Functions → Secrets):
--    • WEBHOOK_SECRET → mismo valor que gcasa_webhook_secret
--    • APNS_KEY_ID    → ya configurado en Fase 1
--    • APNS_TEAM_ID   → ya configurado en Fase 1
--    • APNS_AUTH_KEY  → ya configurado en Fase 1
--    • APNS_BUNDLE_ID → com.carlosgil.gesticasa (ya configurado en Fase 1)
--
-- C) TRIGGERS SQL + PG_NET:
--    La arquitectura utiliza triggers SQL en las tablas (issues, issue_messages, tenant_messages)
--    que invocan asíncronamente a process-push-event utilizando pg_net.
--    Asegúrate de que estos triggers envíen el header:
--    x-webhook-secret: <mismo valor que gcasa_webhook_secret>
--
-- D) PG_CRON (SQL Editor — una sola vez):
--    SELECT cron.schedule(
--      'gcasa-check-debt-notifications',
--      '5 6 * * *',
--      'SELECT public.gcasa_invoke_debt_check();'
--    );
--
-- EXTENSIONES REQUERIDAS (activar en Database → Extensions si no están activas):
--    • pg_net   (llamadas HTTP asíncronas)
--    • pg_cron  (tareas programadas)
--    • vault    (secretos cifrados)
-- =============================================================================
