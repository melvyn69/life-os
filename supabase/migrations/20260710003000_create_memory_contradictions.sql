create table public.memory_contradictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  observation_id uuid references public.observations(id) on delete set null,
  entity_id uuid references public.entities(id) on delete set null,
  memory_id uuid references public.memories(id) on delete set null,
  existing_record_type text not null,
  contradiction_type text not null,
  existing_content text not null,
  new_content text not null,
  reason text not null,
  confidence text not null default 'medium',
  resolution_status text not null default 'unresolved',
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memory_contradictions_existing_record_type_check
    check (existing_record_type in ('entity', 'memory')),
  constraint memory_contradictions_type_check
    check (contradiction_type in ('date', 'location', 'organization', 'project_status', 'role')),
  constraint memory_contradictions_confidence_check
    check (confidence in ('medium', 'high')),
  constraint memory_contradictions_resolution_status_check
    check (resolution_status in ('unresolved', 'resolved', 'dismissed')),
  constraint memory_contradictions_status_check
    check (status in ('suggested', 'active', 'confirmed', 'hidden', 'archived', 'deleted')),
  constraint memory_contradictions_existing_link_check
    check (
      (existing_record_type = 'entity' and entity_id is not null and memory_id is null)
      or
      (existing_record_type = 'memory' and memory_id is not null)
    )
);

grant select, insert, update, delete on table public.memory_contradictions to authenticated;
grant select, insert, update, delete on table public.memory_contradictions to service_role;

alter table public.memory_contradictions enable row level security;

create policy "Users can select own memory contradictions"
on public.memory_contradictions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own memory contradictions"
on public.memory_contradictions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own memory contradictions"
on public.memory_contradictions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own memory contradictions"
on public.memory_contradictions for delete
to authenticated
using ((select auth.uid()) = user_id);
