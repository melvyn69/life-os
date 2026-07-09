create table public.memory_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  observation_id uuid not null references public.observations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  memory_id uuid references public.memories(id) on delete cascade,
  direction text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint memory_evidence_target_check
    check ((entity_id is null) <> (memory_id is null)),
  constraint memory_evidence_direction_check
    check (direction in ('supports', 'contradicts')),
  constraint memory_evidence_reason_check
    check (length(trim(reason)) > 0 and length(reason) <= 500)
);

create unique index memory_evidence_unique_entity_observation
on public.memory_evidence (user_id, observation_id, entity_id, direction)
where entity_id is not null;

create unique index memory_evidence_unique_memory_observation
on public.memory_evidence (user_id, observation_id, memory_id, direction)
where memory_id is not null;

grant select, insert on table public.memory_evidence to authenticated;
grant select, insert on table public.memory_evidence to service_role;

alter table public.memory_evidence enable row level security;

create policy "Users can select own memory evidence"
on public.memory_evidence for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own memory evidence"
on public.memory_evidence for insert
to authenticated
with check ((select auth.uid()) = user_id);
