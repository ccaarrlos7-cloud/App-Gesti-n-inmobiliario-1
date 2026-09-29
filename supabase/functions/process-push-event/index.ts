/**
 * process-push-event — Motor único de notificaciones push de GestiCasa
 *
 * RESPONSABILIDADES EXCLUSIVAS DE ESTA FUNCIÓN:
 *   1. Autenticar la petición entrante (webhook secret).
 *   2. Parsear el evento (Database Webhook o llamada interna de check-debt).
 *   3. Determinar el tipo de evento.
 *   4. Resolver el destinatario desde la base de datos (nunca del frontend).
 *   5. Construir la clave de idempotencia.
 *   6. Comprobar y registrar en notification_logs (única escritura posible).
 *   7. Obtener user_push_tokens del destinatario.
 *   8. Generar JWT APNs y enviar a todos los dispositivos del destinatario.
 *   9. Limpiar tokens inválidos.
 *
 * FUENTES DE EVENTOS:
 *   A) Database Webhooks de Supabase → payload formato { type, table, record, old_record }
 *   B) check-debt-notifications → payload formato { event_type: "debt_alert", contract_id, month_key }
 *
 * SEGURIDAD:
 *   - Verificación por x-webhook-secret header (configurado en Supabase → Edge Function Secrets).
 *   - El destinatario se resuelve SIEMPRE en backend mediante consultas a Supabase.
 *   - Los Secrets APNs solo existen en Supabase Edge Function Secrets.
 *   - Ningún dato sensible aparece en el payload push visible al usuario.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

// ---------------------------------------------------------------------------
// Tipos de payload
// ---------------------------------------------------------------------------

/** Payload enviado por Supabase Database Webhooks */
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  schema: string
  record: Record<string, unknown>
  old_record: Record<string, unknown> | null
}

/** Payload enviado por check-debt-notifications */
interface DebtPayload {
  event_type: "debt_alert"
  contract_id: string
  month_key: string // formato "YYYY-MM"
}

/** Resultado interno de la resolución de un evento */
interface ResolvedEvent {
  event_type: string
  idempotency_key: string
  recipient_user_id: string
}

// ---------------------------------------------------------------------------
// Textos de notificación (sin datos sensibles)
// ---------------------------------------------------------------------------
const PUSH_MESSAGES: Record<string, { title: string; body: string }> = {
  issue_created: {
    title: "GestiCasa",
    body: "Tienes una nueva incidencia en GestiCasa.",
  },
  issue_message: {
    title: "GestiCasa",
    body: "Tienes un nuevo mensaje en una incidencia de GestiCasa.",
  },
  issue_status_changed: {
    title: "GestiCasa",
    body: "Una incidencia de GestiCasa ha sido actualizada.",
  },
  tenant_message: {
    title: "GestiCasa",
    body: "Tienes un nuevo mensaje en GestiCasa.",
  },
  debt_alert: {
    title: "GestiCasa",
    body: "Revisa los ingresos: aparece un alquiler en deuda en GestiCasa.",
  },
}

// ---------------------------------------------------------------------------
// Helpers de resolución de destinatarios
// Siempre consultan Supabase con service_role; nunca aceptan datos del frontend.
// ---------------------------------------------------------------------------

/** Devuelve el user_id del propietario de una propiedad */
async function getOwnerOfProperty(db: SupabaseClient, propertyId: string): Promise<string | null> {
  const { data } = await db.from("properties").select("user_id").eq("id", propertyId).single()
  return (data?.user_id as string) ?? null
}

/** Devuelve el profile_id del inquilino activo vinculado a una propiedad */
async function getTenantProfileForProperty(db: SupabaseClient, propertyId: string): Promise<string | null> {
  const { data } = await db
    .from("contracts")
    .select("contract_tenants(tenants(profile_id))")
    .eq("property_id", propertyId)
    .eq("status", "Activo")
    .limit(1)
    .single()

  if (!data) return null
  // Navegar la estructura anidada del join
  const ct = (data as Record<string, unknown>)["contract_tenants"] as Array<Record<string, unknown>>
  if (!ct?.length) return null
  const tenant = ct[0]["tenants"] as Record<string, unknown>
  const profileId = tenant?.["profile_id"] as string
  return profileId ?? null
}

/** Devuelve el propietario vinculado a un tenant_id (via contrato activo) */
async function getOwnerOfTenant(db: SupabaseClient, tenantId: string): Promise<string | null> {
  const { data: ctData } = await db
    .from("contract_tenants")
    .select("contract_id")
    .eq("tenant_id", tenantId);

  if (!ctData || ctData.length === 0) return null;
  const contractIds = ctData.map((ct: any) => ct.contract_id);

  const { data: contract } = await db
    .from("contracts")
    .select("property_id")
    .in("id", contractIds)
    .eq("status", "Activo")
    .limit(1)
    .single();

  if (!contract?.property_id) return null;
  return getOwnerOfProperty(db, contract.property_id as string);
}

/** Devuelve el profile_id del inquilino vinculado a un issue_id */
async function getTenantProfileForIssue(db: SupabaseClient, issueId: string): Promise<string | null> {
  const { data } = await db.from("issues").select("property_id").eq("id", issueId).single()
  if (!data?.property_id) return null
  return getTenantProfileForProperty(db, data.property_id as string)
}

// ---------------------------------------------------------------------------
// Resolver el evento según el formato del payload entrante
// Devuelve uno o más ResolvedEvent (un issue INSERT puede notificar a ambas partes)
// ---------------------------------------------------------------------------
async function resolveEvents(
  db: SupabaseClient,
  body: Record<string, unknown>
): Promise<ResolvedEvent[]> {
  const results: ResolvedEvent[] = []

  // ---- CASO A: Database Webhook ----
  if ("type" in body && "table" in body) {
    const wh = body as unknown as WebhookPayload
    const { type, table, record, old_record } = wh

    // --- issues INSERT → nueva incidencia ---
    if (table === "issues" && type === "INSERT") {
      const propertyId = record["property_id"] as string
      const issueId = record["id"] as string
      const createdByRole = record["created_by_role"] as string | undefined

      if (createdByRole === "propietario") {
        const tenant = await getTenantProfileForProperty(db, propertyId)
        if (tenant) {
          results.push({
            event_type: "issue_created",
            idempotency_key: `issue:${issueId}:created:${tenant}`,
            recipient_user_id: tenant,
          })
        }
      } else if (createdByRole === "inquilino") {
        const owner = await getOwnerOfProperty(db, propertyId)
        if (owner) {
          results.push({
            event_type: "issue_created",
            idempotency_key: `issue:${issueId}:created:${owner}`,
            recipient_user_id: owner,
          })
        }
      }
      // Si created_by_role es nulo (incidencias históricas), no se envía notificación.
    }

    // --- issues UPDATE → cambio de estado ---
    if (table === "issues" && type === "UPDATE") {
      const newStatus = record["status"] as string
      const oldStatus = old_record?.["status"] as string
      // Salir si status no cambió (el webhook se dispara en cualquier UPDATE)
      if (!newStatus || newStatus === oldStatus) return []

      const issueId = record["id"] as string
      const tenant = await getTenantProfileForIssue(db, issueId)
      if (tenant) {
        results.push({
          event_type: "issue_status_changed",
          idempotency_key: `issue_status:${issueId}:${newStatus}:${tenant}`,
          recipient_user_id: tenant,
        })
      }
    }

    // --- issue_messages INSERT → mensaje en incidencia ---
    if (table === "issue_messages" && type === "INSERT") {
      const issueId = record["issue_id"] as string
      const authorRole = record["author_role"] as string
      const messageId = record["id"] as string

      let recipient: string | null = null
      if (authorRole === "propietario") {
        recipient = await getTenantProfileForIssue(db, issueId)
      } else {
        const { data: issue } = await db.from("issues").select("property_id").eq("id", issueId).single()
        if (issue?.property_id) {
          recipient = await getOwnerOfProperty(db, issue.property_id as string)
        }
      }

      if (recipient) {
        results.push({
          event_type: "issue_message",
          idempotency_key: `issue_message:${messageId}:${recipient}`,
          recipient_user_id: recipient,
        })
      }
    }

    // --- tenant_messages INSERT → mensaje general ---
    if (table === "tenant_messages" && type === "INSERT") {
      const tenantId = record["tenant_id"] as string
      const authorRole = record["author_role"] as string
      const messageId = record["id"] as string

      let recipient: string | null = null
      if (authorRole === "propietario") {
        // Propietario escribe → notificar al inquilino
        const { data: tenant } = await db.from("tenants").select("profile_id").eq("id", tenantId).single()
        recipient = (tenant?.profile_id as string) ?? null
      } else {
        // Inquilino escribe → notificar al propietario
        recipient = await getOwnerOfTenant(db, tenantId)
      }

      if (recipient) {
        results.push({
          event_type: "tenant_message",
          idempotency_key: `tenant_message:${messageId}:${recipient}`,
          recipient_user_id: recipient,
        })
      }
    }

    return results
  }

  // ---- CASO B: Llamada de check-debt-notifications ----
  if ("event_type" in body && body["event_type"] === "debt_alert") {
    const { contract_id, month_key } = body as unknown as DebtPayload

    // Resolver el propietario del contrato en backend (no se acepta del caller)
    const { data: contract } = await db
      .from("contracts")
      .select("property_id")
      .eq("id", contract_id)
      .single()

    if (!contract?.property_id) return []
    const owner = await getOwnerOfProperty(db, contract.property_id as string)
    if (!owner) return []

    results.push({
      event_type: "debt_alert",
      idempotency_key: `debt:${contract_id}:${month_key}:${owner}`,
      recipient_user_id: owner,
    })
    return results
  }

  console.warn("[PUSH] Payload no reconocido:", JSON.stringify(body).slice(0, 200))
  return []
}

// ---------------------------------------------------------------------------
// APNs — Generación de JWT
// ---------------------------------------------------------------------------
async function buildApnsJwt(keyId: string, teamId: string, privateKeyPem: string): Promise<string> {
  const privateKey = await jose.importPKCS8(privateKeyPem, "ES256")
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(privateKey)
}

// ---------------------------------------------------------------------------
// APNs — Envío a un token individual
// ---------------------------------------------------------------------------
async function sendToToken(
  deviceToken: string,
  environment: string,
  jwt: string,
  bundleId: string,
  message: { title: string; body: string }
): Promise<{ success: boolean; shouldDelete: boolean }> {
  const isSandbox = environment === "development"
  const apnsHost = isSandbox ? "api.sandbox.push.apple.com" : "api.push.apple.com"

  const response = await fetch(`https://${apnsHost}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
    },
    body: JSON.stringify({ aps: { alert: { title: message.title, body: message.body }, sound: "default" } }),
  })

  if (response.ok) return { success: true, shouldDelete: false }

  const errorBody = await response.text()
  console.error(`[PUSH] APNs ${response.status}: ${errorBody.slice(0, 100)} (token ...${deviceToken.slice(-8)})`)

  const shouldDelete =
    response.status === 410 ||
    (response.status === 400 && errorBody.includes("BadDeviceToken")) ||
    errorBody.includes("Unregistered")

  return { success: false, shouldDelete }
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200 })
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
    }

    // ---- Autenticación por webhook secret ----
    // Se verifica el mismo secret tanto para Database Webhooks como para
    // llamadas internas de check-debt-notifications.
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET")
    if (!webhookSecret) {
      console.error("[PUSH] Webhook secret no configurado en el entorno")
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
    }

    const incoming = req.headers.get("x-webhook-secret")
    if (incoming !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    // ---- Parsear body ----
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 })
    }

    // ---- Cliente Supabase con service_role ----
    const db = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // ---- Resolver los eventos (uno o más destinatarios) ----
    const resolvedEvents = await resolveEvents(db, body)

    if (resolvedEvents.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_recipients" }), { status: 200 })
    }

    // ---- Obtener secrets APNs (una sola vez por invocación) ----
    const apnsKeyId = Deno.env.get("APNS_KEY_ID")
    const apnsTeamId = Deno.env.get("APNS_TEAM_ID")
    const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID") || "com.carlosgil.gesticasa"
    const apnsAuthKeyStr = Deno.env.get("APNS_AUTH_KEY")

    if (!apnsKeyId || !apnsTeamId || !apnsAuthKeyStr) {
      console.error("[PUSH] APNs secrets no configurados")
      return new Response(JSON.stringify({ error: "APNs configuration missing" }), { status: 500 })
    }

    const privateKeyPem = apnsAuthKeyStr.replace(/\\n/g, "\n")
    const apnsJwt = await buildApnsJwt(apnsKeyId, apnsTeamId, privateKeyPem)

    const allResults = []

    for (const event of resolvedEvents) {
      const { event_type, idempotency_key, recipient_user_id } = event

      // ---- Idempotencia: intentar insertar en notification_logs ----
      let canProceed = false;
      const { error: insertError } = await db
        .from("notification_logs")
        .insert({ idempotency_key, recipient_user_id, event_type, status: "processing" });

      if (!insertError) {
        canProceed = true;
      } else if (insertError.code === "23505") {
        // Ya existe. Usamos la concurrencia de PostgreSQL para evitar carreras:
        // Actualizamos a 'processing' y renovamos 'created_at' SOLO si actualmente está 'failed'
        // o si está 'processing' pero es más antiguo de 10 minutos (atascado).
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: updated } = await db
          .from("notification_logs")
          .update({ 
            status: "processing", 
            created_at: new Date().toISOString() 
          })
          .eq("idempotency_key", idempotency_key)
          .or(`status.eq.failed,and(status.eq.processing,created_at.lt.${tenMinsAgo})`)
          .select();
        
        if (updated && updated.length > 0) {
          canProceed = true;
        }
      }

      if (!canProceed) {
        console.log(`[PUSH] Duplicado omitido o ya procesando: ${idempotency_key}`)
        allResults.push({ idempotency_key, skipped: true })
        continue
      }

      // ---- Obtener tokens APNs del destinatario ----
      const { data: tokens } = await db
        .from("user_push_tokens")
        .select("id, device_token, platform, environment")
        .eq("user_id", recipient_user_id)
        .eq("platform", "ios")

      if (!tokens || tokens.length === 0) {
        console.log(`[PUSH] Sin tokens iOS para usuario ${recipient_user_id} (${event_type})`)
        // Actualizar status en notification_logs a 'skipped'
        await db.from("notification_logs").update({ status: "skipped" }).eq("idempotency_key", idempotency_key)
        allResults.push({ idempotency_key, skipped: true, reason: "no_tokens" })
        continue
      }

      // ---- Obtener mensaje para el tipo de evento ----
      const message = PUSH_MESSAGES[event_type]
      if (!message) {
        console.warn(`[PUSH] Tipo de evento desconocido: ${event_type}`)
        await db.from("notification_logs").update({ status: "failed" }).eq("idempotency_key", idempotency_key)
        continue
      }

      // ---- Enviar a cada token ----
      const tokenResults = await Promise.all(
        tokens.map(async (token) => {
          const result = await sendToToken(token.device_token, token.environment, apnsJwt, apnsBundleId, message)
          if (result.shouldDelete) {
            await db.from("user_push_tokens").delete().eq("id", token.id)
            console.log(`[PUSH] Token inválido eliminado: ...${token.device_token.slice(-8)}`)
          }
          return { suffix: token.device_token.slice(-8), ...result }
        })
      )

      const sent = tokenResults.filter((r) => r.success).length
      console.log(`[PUSH] ${event_type} → ${recipient_user_id} | ${sent}/${tokens.length} tokens`)

      // Actualizar status final según el resultado de APNs
      if (sent === 0) {
        await db.from("notification_logs").update({ status: "failed" }).eq("idempotency_key", idempotency_key)
      } else {
        await db.from("notification_logs").update({ status: "sent" }).eq("idempotency_key", idempotency_key)
      }

      allResults.push({ idempotency_key, sent, total: tokens.length, results: tokenResults })
    }

    return new Response(
      JSON.stringify({ success: true, processed: allResults.length, results: allResults }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("[PUSH] Error no manejado:", msg)
    return new Response(JSON.stringify({ error: "Internal Server Error", message: msg }), { status: 500 })
  }
})
