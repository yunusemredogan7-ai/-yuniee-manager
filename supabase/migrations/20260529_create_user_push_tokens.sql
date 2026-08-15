-- Push token storage for owner/admin device registrations.
-- This migration stores device tokens only for the authenticated owner who registered them.

create table if not exists public.user_push_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    token text not null,
    platform text not null default 'ios',
    device_name text,
    app_version text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint user_push_tokens_platform_check check (platform in ('ios', 'android')),
    constraint user_push_tokens_user_token_unique unique (user_id, token)
);

alter table public.user_push_tokens enable row level security;

drop policy if exists "Users can select own push tokens" on public.user_push_tokens;
create policy "Users can select own push tokens"
on public.user_push_tokens
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own push tokens" on public.user_push_tokens;
create policy "Users can insert own push tokens"
on public.user_push_tokens
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own push tokens" on public.user_push_tokens;
create policy "Users can update own push tokens"
on public.user_push_tokens
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push tokens" on public.user_push_tokens;
create policy "Users can delete own push tokens"
on public.user_push_tokens
for delete
using (auth.uid() = user_id);

create or replace function public.set_user_push_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_user_push_tokens_updated_at on public.user_push_tokens;
create trigger set_user_push_tokens_updated_at
before update on public.user_push_tokens
for each row
execute function public.set_user_push_tokens_updated_at();
