create or replace function public.record_memory_history_event()
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
  elsif old.confidence is distinct from new.confidence
    and (case new.confidence when 'low' then 1 when 'medium' then 2 when 'high' then 3 when 'confirmed' then 4 end)
      < (case old.confidence when 'low' then 1 when 'medium' then 2 when 'high' then 3 when 'confirmed' then 4 end)
  then
    history_event_type := 'corrected';
    history_reason := 'A user correction lowered confidence while preserving the prior state.';
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
