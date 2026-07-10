create schema if not exists life_os_internal;

revoke all on schema life_os_internal from public, anon, authenticated;

create or replace function life_os_internal.record_memory_history_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
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

  if old.sensitivity is distinct from new.sensitivity
    or old.type is distinct from new.type
    or (TG_TABLE_NAME = 'entities' and (to_jsonb(old) -> 'name') is distinct from (to_jsonb(new) -> 'name'))
    or (TG_TABLE_NAME = 'entities' and (to_jsonb(old) -> 'description') is distinct from (to_jsonb(new) -> 'description'))
    or (TG_TABLE_NAME = 'memories' and (to_jsonb(old) -> 'content') is distinct from (to_jsonb(new) -> 'content'))
    or (TG_TABLE_NAME = 'memories' and (to_jsonb(old) -> 'entity_id') is distinct from (to_jsonb(new) -> 'entity_id'))
  then
    history_event_type := 'corrected';
    history_reason := 'The user corrected this record while preserving the prior state.';
  elsif old.confidence is distinct from new.confidence and new.confidence = 'confirmed' then
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

revoke all on function life_os_internal.record_memory_history_event() from public, anon, authenticated;

drop trigger if exists record_entity_memory_history on public.entities;
drop trigger if exists record_memory_memory_history on public.memories;

create trigger record_entity_memory_history
after update of name, type, description, confidence, sensitivity, status
on public.entities
for each row
execute function life_os_internal.record_memory_history_event();

create trigger record_memory_memory_history
after update of entity_id, content, type, confidence, sensitivity, status
on public.memories
for each row
execute function life_os_internal.record_memory_history_event();

drop function if exists public.record_memory_history_event();

revoke all on table public.memory_history_events from public, anon, authenticated;
grant select on table public.memory_history_events to authenticated;

create or replace function life_os_internal.enforce_confirmed_confidence()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if new.confidence = 'confirmed'
    and current_setting('life_os.validation_operation', true) is distinct from 'confirmed'
  then
    raise exception 'Confirmed confidence requires an explicit validation operation.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function life_os_internal.enforce_confirmed_confidence() from public, anon, authenticated;

create trigger enforce_entity_confirmed_confidence
before insert or update of confidence on public.entities
for each row
execute function life_os_internal.enforce_confirmed_confidence();

create trigger enforce_memory_confirmed_confidence
before insert or update of confidence on public.memories
for each row
execute function life_os_internal.enforce_confirmed_confidence();

create or replace function public.confirm_entity(p_entity_id uuid)
returns public.entities
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
declare
  updated_entity public.entities;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform set_config('life_os.validation_operation', 'confirmed', true);

  update public.entities
  set confidence = 'confirmed', status = 'active', updated_at = now()
  where id = p_entity_id
    and user_id = auth.uid()
    and status = 'suggested'
  returning * into updated_entity;

  if not found then
    raise exception 'Suggested entity was not found.' using errcode = 'P0002';
  end if;

  return updated_entity;
end;
$$;

create or replace function public.correct_entity(p_entity_id uuid, p_description text)
returns public.entities
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
declare
  updated_entity public.entities;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform set_config('life_os.validation_operation', 'confirmed', true);

  update public.entities
  set confidence = 'confirmed', description = nullif(trim(p_description), ''), status = 'active', updated_at = now()
  where id = p_entity_id
    and user_id = auth.uid()
    and status in ('suggested', 'active')
  returning * into updated_entity;

  if not found then
    raise exception 'Entity was not found.' using errcode = 'P0002';
  end if;

  return updated_entity;
end;
$$;

create or replace function public.confirm_memory(p_memory_id uuid)
returns public.memories
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
declare
  updated_memory public.memories;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform set_config('life_os.validation_operation', 'confirmed', true);

  update public.memories
  set confidence = 'confirmed', status = 'active', updated_at = now()
  where id = p_memory_id
    and user_id = auth.uid()
    and status = 'suggested'
  returning * into updated_memory;

  if not found then
    raise exception 'Suggested memory was not found.' using errcode = 'P0002';
  end if;

  return updated_memory;
end;
$$;

create or replace function public.correct_memory(p_memory_id uuid, p_content text)
returns public.memories
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
declare
  updated_memory public.memories;
  corrected_content text := trim(p_content);
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if corrected_content = '' then
    raise exception 'A correction needs some text.' using errcode = '22023';
  end if;

  perform set_config('life_os.validation_operation', 'confirmed', true);

  update public.memories
  set confidence = 'confirmed', content = corrected_content, status = 'active', updated_at = now()
  where id = p_memory_id
    and user_id = auth.uid()
    and status in ('suggested', 'active')
  returning * into updated_memory;

  if not found then
    raise exception 'Memory was not found.' using errcode = 'P0002';
  end if;

  return updated_memory;
end;
$$;

revoke all on function public.confirm_entity(uuid) from public, anon;
revoke all on function public.correct_entity(uuid, text) from public, anon;
revoke all on function public.confirm_memory(uuid) from public, anon;
revoke all on function public.correct_memory(uuid, text) from public, anon;

grant execute on function public.confirm_entity(uuid) to authenticated;
grant execute on function public.correct_entity(uuid, text) to authenticated;
grant execute on function public.confirm_memory(uuid) to authenticated;
grant execute on function public.correct_memory(uuid, text) to authenticated;
