-- Stabilize tasks for the existing Kanban To Do screen.
-- Safe to run more than once. Existing task rows are preserved.

alter table public.tasks
  add column if not exists description text,
  add column if not exists status text,
  add column if not exists label text,
  add column if not exists waiting_reason text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz;

update public.tasks
set status = case when completed then 'done' else 'todo' end
where status is null;

update public.tasks
set sort_order = id
where sort_order = 0;

alter table public.tasks
  alter column status set default 'todo';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_status_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_status_check
      check (status in ('idea', 'todo', 'in_progress', 'waiting', 'done'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_label_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_label_check
      check (
        label is null
        or label in ('mekan', 'personel', 'teklif', 'yuniee', 'finans', 'ai', 'kisisel', 'saglik')
      );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();
