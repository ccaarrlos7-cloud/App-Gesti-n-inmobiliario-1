drop table if exists public.user_push_tokens;

create table public.user_push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  device_token text not null unique,
  platform text not null,
  environment text not null default 'development',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.user_push_tokens enable row level security;

-- Política: Un usuario solo puede ver sus propios tokens
create policy "Users can view own push tokens" 
on public.user_push_tokens for select 
using (auth.uid() = user_id);

-- Política: Un usuario solo puede insertar sus propios tokens
-- Permite insertar, y si hay conflicto por device_token, el nuevo usuario puede tomar posesión
create policy "Users can insert own push tokens" 
on public.user_push_tokens for insert 
with check (auth.uid() = user_id);

-- Política: Un usuario solo puede actualizar sus propios tokens
create policy "Users can update own push tokens" 
on public.user_push_tokens for update 
using (auth.uid() = user_id);

-- Política: Un usuario solo puede borrar sus propios tokens
create policy "Users can delete own push tokens" 
on public.user_push_tokens for delete 
using (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.user_push_tokens
for each row execute function public.handle_updated_at();
