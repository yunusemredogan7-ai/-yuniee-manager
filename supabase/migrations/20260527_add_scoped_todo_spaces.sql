-- Add owner/admin To Do spaces:
-- - yuniee: shared board visible to both users
-- - irem: private board for Irem
-- - yemre: private board for Yemre
--
-- Existing tasks are preserved as shared YUNIEE tasks.

alter table public.tasks
  add column if not exists task_scope text not null default 'yuniee';

update public.tasks
set task_scope = 'yuniee'
where task_scope is null
   or task_scope not in ('yuniee', 'irem', 'yemre');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_task_scope_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_task_scope_check
      check (task_scope in ('yuniee', 'irem', 'yemre'));
  end if;
end $$;

create index if not exists tasks_task_scope_status_created_at_idx
  on public.tasks (task_scope, status, created_at desc);

create or replace function public.current_todo_scopes()
returns text[]
language sql
stable
as $$
  with identity as (
    select lower(concat_ws(
      ' ',
      coalesce(auth.jwt() ->> 'email', ''),
      coalesce(auth.jwt() -> 'user_metadata' ->> 'name', ''),
      coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
    )) as value
  )
  select
    case
      when auth.role() <> 'authenticated' then array[]::text[]
      when value like '%irem%' then array['yuniee', 'irem']::text[]
      when value like '%yemre%' or value like '%yunus%' or value like '%emre%' then array['yuniee', 'yemre']::text[]
      else array['yuniee']::text[]
    end
  from identity;
$$;

alter table public.tasks enable row level security;

drop policy if exists tasks_select_authenticated on public.tasks;
drop policy if exists tasks_insert_authenticated on public.tasks;
drop policy if exists tasks_update_authenticated on public.tasks;
drop policy if exists tasks_delete_authenticated on public.tasks;

create policy tasks_select_scoped_authenticated
on public.tasks
for select
to authenticated
using (task_scope = any(public.current_todo_scopes()));

create policy tasks_insert_scoped_authenticated
on public.tasks
for insert
to authenticated
with check (task_scope = any(public.current_todo_scopes()));

create policy tasks_update_scoped_authenticated
on public.tasks
for update
to authenticated
using (task_scope = any(public.current_todo_scopes()))
with check (task_scope = any(public.current_todo_scopes()));

create policy tasks_delete_scoped_authenticated
on public.tasks
for delete
to authenticated
using (task_scope = any(public.current_todo_scopes()));
