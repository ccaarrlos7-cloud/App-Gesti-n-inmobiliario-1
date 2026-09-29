create or replace function public.register_device_token(p_token text, p_platform text, p_env text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;
  
  if p_token is null or p_token = '' then
    raise exception 'Device token is required';
  end if;

  -- Eliminar asociaciones previas de este token físico, saltando RLS (por security definer)
  delete from public.user_push_tokens 
  where device_token = p_token;
  
  -- Insertar la nueva asociación
  insert into public.user_push_tokens (user_id, device_token, platform, environment)
  values (v_uid, p_token, p_platform, p_env);
end;
$$;

revoke execute on function public.register_device_token(text, text, text) from public;
grant execute on function public.register_device_token(text, text, text) to authenticated;
