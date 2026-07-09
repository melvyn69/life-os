create table public.memory_history_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_type text not null,
  entity_id uuid references public.entities(id) on delete cascade,
  memory_id uuid references public.memories(id) on delete cascade,
  event_type text not null,
  reason text not null,
  previous_state jsonb,
  current_state jsonb not null,
  evidence_ids uuid[] not null default '{}'::uuid[],
  evidence_observation_ids uuid[] not null default '{}'::uuid[],
  has_unresolved_contradiction boolean not null default false,
  created_at timestamptz not null default now(),
  constraint memory_history_events_record_type_check
    check (record_type in ('entity', 'memory')),
  constraint memory_history_events_target_check
    check (
      (record_type = 'entity' and entity_id is not null and memory_id is null)
      or
      (record_type = 'memory' and memory_id is not null and entity_id is null)
    ),
  constraint memory_history_events_event_type_check
    check (event_type in ('baseline', 'confidence_evolved', 'user_validated', 'archived', 'hidden', 'status_changed', 'corrected')),
  constraint memory_history_events_reason_check
    check (length(trim(reason)) > 0 and length(reason) <= 500)
);

create index memory_history_events_user_created_at_idx
on public.memory_history_events (user_id, created_at desc);

create index memory_history_events_entity_created_at_idx
on public.memory_history_events (entity_id, created_at desc)
where entity_id is not null;

create index memory_history_events_memory_created_at_idx
on public.memory_history_events (memory_id, created_at desc)
where memory_id is not null;

revoke all on table public.memory_history_events from anon, authenticated;
grant select on table public.memory_history_events to authenticated;

alter table public.memory_history_events enable row level security;

create policy "Users can select own memory history events"
on public.memory_history_events for select
to authenticated
using ((select auth.uid()) = user_id);

insert into public.memory_history_events (
  user_id,
  record_type,
  entity_id,
  memory_id,
  event_type,
  reason,
  previous_state,
  current_state,
  evidence_ids,
  evidence_observation_ids,
  has_unresolved_contradiction
)
select
  entities.user_id,
  'entity',
  entities.id,
  null,
  'baseline',
  'History tracking started for this existing entity.',
  null,
  to_jsonb(entities) - array['id', 'user_id', 'created_at', 'updated_at'],
  coalesce((
    select array_agg(evidence.id order by evidence.created_at)
    from public.memory_evidence as evidence
    where evidence.user_id = entities.user_id
      and evidence.entity_id = entities.id
  ), '{}'::uuid[]),
  coalesce((
    select array_agg(evidence.observation_id order by evidence.created_at)
    from public.memory_evidence as evidence
    where evidence.user_id = entities.user_id
      and evidence.entity_id = entities.id
  ), '{}'::uuid[]),
  exists (
    select 1
    from public.memory_contradictions as contradictions
    where contradictions.user_id = entities.user_id
      and contradictions.entity_id = entities.id
      and contradictions.resolution_status = 'unresolved'
  )
from public.entities;

insert into public.memory_history_events (
  user_id,
  record_type,
  entity_id,
  memory_id,
  event_type,
  reason,
  previous_state,
  current_state,
  evidence_ids,
  evidence_observation_ids,
  has_unresolved_contradiction
)
select
  memories.user_id,
  'memory',
  null,
  memories.id,
  'baseline',
  'History tracking started for this existing memory.',
  null,
  to_jsonb(memories) - array['id', 'user_id', 'created_at', 'updated_at'],
  coalesce((
    select array_agg(evidence.id order by evidence.created_at)
    from public.memory_evidence as evidence
    where evidence.user_id = memories.user_id
      and evidence.memory_id = memories.id
  ), '{}'::uuid[]),
  coalesce((
    select array_agg(evidence.observation_id order by evidence.created_at)
    from public.memory_evidence as evidence
    where evidence.user_id = memories.user_id
      and evidence.memory_id = memories.id
  ), '{}'::uuid[]),
  exists (
    select 1
    from public.memory_contradictions as contradictions
    where contradictions.user_id = memories.user_id
      and contradictions.memory_id = memories.id
      and contradictions.resolution_status = 'unresolved'
  )
from public.memories;

create function public.record_memory_history_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  history_event_type text;
  history_reason text;
  target_type text := case TG_TABLE_NAME when 'entities' then 'entity' else 'memory' end;
  target_column text := case TG_TABLE_NAME when 'entities' then 'entity_id' else 'memory_id' end;
  evidence_ids uuid[];
  evidence_observation_ids uuid[];
  has_unresolved_contradiction boolean;
begin
  if old.confidence is not distinct from new.confidence
    and old.status is not distinct from new.status
    and old.sensitivity is not distinct from new.sensitivity
    and old.type is not distinct from new.type
    and (TG_TABLE_NAME <> 'entities' or (to_jsonb(old) -> 'name') is not distinct from (to_jsonb(new) -> 'name'))
    and (TG_TABLE_NAME <> 'entities' or (to_jsonb(old) -> 'description') is not distinct from (to_jsonb(new) -> 'description'))
    and (TG_TABLE_NAME <> 'memories' or (to_jsonb(old) -> 'content') is not distinct from (to_jsonb(new) -> 'content'))
    and (TG_TABLE_NAME <> 'memories' or (to_jsonb(old) -> 'entity_id') is not distinct from (to_jsonb(new) -> 'entity_id'))
  then
    return new;
  end if;

  if old.confidence is distinct from new.confidence and new.confidence = 'confirmed' then
    history_event_type := 'user_validated';
    history_reason := 'The user explicitly validated this record.';
  elsif old.confidence is distinct from new.confidence then
    history_event_type := 'confidence_evolved';
    history_reason := 'Confidence changed with recorded evidence available for review.';
  elsif old.status is distinct from new.status and new.status = 'archived' then
    history_event_type := 'archived';
    history_reason := 'The record was archived and no longer influences current memory.';
  elsif old.status is distinct from new.status and new.status = 'hidden' then
    history_event_type := 'hidden';
    history_reason := 'The record was hidden from the active experience.';
  elsif old.status is distinct from new.status then
    history_event_type := 'status_changed';
    history_reason := 'The record status changed while preserving its prior state.';
  else
    history_event_type := 'corrected';
    history_reason := 'The record changed while preserving its prior state.';
  end if;

  select
    coalesce(array_agg(evidence.id order by evidence.created_at), '{}'::uuid[]),
    coalesce(array_agg(evidence.observation_id order by evidence.created_at), '{}'::uuid[])
  into evidence_ids, evidence_observation_ids
  from public.memory_evidence as evidence
  where evidence.user_id = new.user_id
    and (
      (target_column = 'entity_id' and evidence.entity_id = new.id)
      or
      (target_column = 'memory_id' and evidence.memory_id = new.id)
    );

  select exists (
    select 1
    from public.memory_contradictions as contradictions
    where contradictions.user_id = new.user_id
      and contradictions.resolution_status = 'unresolved'
      and (
        (target_column = 'entity_id' and contradictions.entity_id = new.id)
        or
        (target_column = 'memory_id' and contradictions.memory_id = new.id)
      )
  ) into has_unresolved_contradiction;

  insert into public.memory_history_events (
    user_id,
    record_type,
    entity_id,
    memory_id,
    event_type,
    reason,
    previous_state,
    current_state,
    evidence_ids,
    evidence_observation_ids,
    has_unresolved_contradiction
  ) values (
    new.user_id,
    target_type,
    case when target_type = 'entity' then new.id else null end,
    case when target_type = 'memory' then new.id else null end,
    history_event_type,
    history_reason,
    to_jsonb(old) - array['id', 'user_id', 'created_at', 'updated_at'],
    to_jsonb(new) - array['id', 'user_id', 'created_at', 'updated_at'],
    evidence_ids,
    evidence_observation_ids,
    has_unresolved_contradiction
  );

  return new;
end;
$$;

revoke all on function public.record_memory_history_event() from public;

create trigger record_entity_memory_history
after update of name, type, description, confidence, sensitivity, status
on public.entities
for each row
execute function public.record_memory_history_event();

create trigger record_memory_memory_history
after update of entity_id, content, type, confidence, sensitivity, status
on public.memories
for each row
execute function public.record_memory_history_event();
