create schema if not exists life_os_internal;

revoke all on schema life_os_internal from public, anon, authenticated;

create or replace function life_os_internal.relationship_snapshot(
  p_relationship public.relationships
)
returns jsonb
language sql
stable
set search_path = pg_catalog, public, pg_temp
as $$
  select to_jsonb(p_relationship) - 'user_id';
$$;

revoke all on function life_os_internal.relationship_snapshot(public.relationships)
from public, anon, authenticated;

create or replace function life_os_internal.relationship_fingerprint(
  p_user_id uuid,
  p_source_entity_id uuid,
  p_target_entity_id uuid,
  p_relationship_type text,
  p_start_date date,
  p_end_date date
)
returns text
language sql
immutable
set search_path = pg_catalog, extensions, pg_temp
as $$
  select encode(
    extensions.digest(
      convert_to(
        concat_ws(
          '|',
          p_user_id::text,
          p_source_entity_id::text,
          p_target_entity_id::text,
          p_relationship_type,
          coalesce(p_start_date::text, 'unknown'),
          coalesce(p_end_date::text, 'unknown')
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function life_os_internal.relationship_fingerprint(uuid, uuid, uuid, text, date, date)
from public, anon, authenticated;

create or replace function life_os_internal.prepare_relationship()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  source_owner uuid;
  source_status text;
  target_owner uuid;
  target_status text;
  target_type text;
  original_source uuid;
begin
  if new.relationship_type = 'contextually_associated_with' then
    new.is_directional := false;

    if new.source_entity_id::text > new.target_entity_id::text then
      original_source := new.source_entity_id;
      new.source_entity_id := new.target_entity_id;
      new.target_entity_id := original_source;
    end if;
  else
    new.is_directional := true;
  end if;

  select entities.user_id, entities.status
  into source_owner, source_status
  from public.entities
  where entities.id = new.source_entity_id;

  select entities.user_id, entities.status, entities.type
  into target_owner, target_status, target_type
  from public.entities
  where entities.id = new.target_entity_id;

  if source_owner is null or target_owner is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if source_owner <> new.user_id or target_owner <> new.user_id then
    raise exception 'ENTITY_OWNERSHIP_MISMATCH' using errcode = '42501';
  end if;

  if source_status = 'deleted' or target_status = 'deleted' then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if new.relationship_type = 'located_at' and target_type <> 'place' then
    raise exception 'INVALID_DIRECTION' using errcode = '22023';
  end if;

  new.candidate_fingerprint := life_os_internal.relationship_fingerprint(
    new.user_id,
    new.source_entity_id,
    new.target_entity_id,
    new.relationship_type,
    new.start_date,
    new.end_date
  );
  new.updated_at := now();

  if new.status = 'archived' then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;

  return new;
end;
$$;

revoke all on function life_os_internal.prepare_relationship()
from public, anon, authenticated;

create or replace function life_os_internal.enforce_relationship_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  operation text := current_setting('life_os.relationship_operation', true);
  semantic_changed boolean;
begin
  if TG_OP = 'INSERT' then
    if operation not in ('ingest', 'migration') then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;

    if new.status not in ('suggested', 'supported')
      or new.confidence not in ('low', 'medium', 'high')
    then
      raise exception 'INVALID_INPUT' using errcode = '22023';
    end if;

    return new;
  end if;

  semantic_changed := old.source_entity_id is distinct from new.source_entity_id
    or old.target_entity_id is distinct from new.target_entity_id
    or old.relationship_type is distinct from new.relationship_type
    or old.start_date is distinct from new.start_date
    or old.end_date is distinct from new.end_date
    or old.date_precision is distinct from new.date_precision;

  if semantic_changed and operation not in ('correct', 'outdate', 'ingest') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if old.is_visible is distinct from new.is_visible
    and operation not in ('visibility', 'correct', 'archive', 'restore')
  then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if old.status is distinct from new.status then
    if new.status = 'confirmed' and operation not in ('confirm', 'correct', 'restore') then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif new.status = 'supported' and operation not in ('ingest', 'restore') then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif new.status = 'rejected' and operation not in ('reject', 'restore') then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif new.status = 'contradicted' and operation not in ('ingest', 'restore') then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif new.status = 'outdated' and operation not in ('outdate', 'restore') then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif new.status = 'archived' and operation <> 'archive' then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif old.status = 'archived' and operation <> 'restore' then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  end if;

  if old.confidence is distinct from new.confidence then
    if (
      case new.confidence
        when 'low' then 1
        when 'medium' then 2
        when 'high' then 3
        when 'confirmed' then 4
      end
    ) < (
      case old.confidence
        when 'low' then 1
        when 'medium' then 2
        when 'high' then 3
        when 'confirmed' then 4
      end
    ) then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif new.confidence = 'confirmed' and operation not in ('confirm', 'correct') then
      raise exception 'FORBIDDEN' using errcode = '42501';
    elsif new.confidence <> 'confirmed' and operation <> 'ingest' then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function life_os_internal.enforce_relationship_transition()
from public, anon, authenticated;

create trigger enforce_relationship_transition
before insert or update on public.relationships
for each row
execute function life_os_internal.enforce_relationship_transition();

create trigger prepare_relationship
before insert or update on public.relationships
for each row
execute function life_os_internal.prepare_relationship();

create or replace function life_os_internal.validate_relationship_evidence()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  related_user_id uuid;
  capture_user_id uuid;
  capture_status text;
  observation_user_id uuid;
  observation_capture_id uuid;
  observation_status text;
  memory_user_id uuid;
  memory_status text;
begin
  select relationships.user_id
  into related_user_id
  from public.relationships
  where relationships.id = new.relationship_id;

  if related_user_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if related_user_id <> new.user_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if new.capture_id is not null then
    select captures.user_id, captures.status
    into capture_user_id, capture_status
    from public.captures
    where captures.id = new.capture_id;

    if capture_user_id is null or capture_status = 'deleted' then
      raise exception 'NOT_FOUND' using errcode = 'P0002';
    end if;

    if capture_user_id <> new.user_id then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  end if;

  if new.observation_id is not null then
    select observations.user_id, observations.capture_id, observations.status
    into observation_user_id, observation_capture_id, observation_status
    from public.observations
    where observations.id = new.observation_id;

    if observation_user_id is null or observation_status = 'deleted' then
      raise exception 'NOT_FOUND' using errcode = 'P0002';
    end if;

    if observation_user_id <> new.user_id then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;

    if new.capture_id is not null
      and observation_capture_id is distinct from new.capture_id
    then
      raise exception 'INVALID_INPUT' using errcode = '22023';
    end if;
  end if;

  if new.memory_id is not null then
    select memories.user_id, memories.status
    into memory_user_id, memory_status
    from public.memories
    where memories.id = new.memory_id;

    if memory_user_id is null or memory_status = 'deleted' then
      raise exception 'NOT_FOUND' using errcode = 'P0002';
    end if;

    if memory_user_id <> new.user_id then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function life_os_internal.validate_relationship_evidence()
from public, anon, authenticated;

create trigger validate_relationship_evidence
before insert on public.relationship_evidence
for each row
execute function life_os_internal.validate_relationship_evidence();

create or replace function life_os_internal.prevent_relationship_append_only_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, pg_temp
as $$
declare
  owner_id uuid := case when TG_OP = 'DELETE' then old.user_id else new.user_id end;
begin
  if TG_OP = 'DELETE'
    and not exists (select 1 from auth.users where users.id = owner_id)
  then
    return old;
  end if;

  raise exception 'FORBIDDEN' using errcode = '42501';
end;
$$;

revoke all on function life_os_internal.prevent_relationship_append_only_mutation()
from public, anon, authenticated;

create trigger prevent_relationship_evidence_mutation
before update or delete on public.relationship_evidence
for each row
execute function life_os_internal.prevent_relationship_append_only_mutation();

create trigger prevent_relationship_history_mutation
before update or delete on public.relationship_history
for each row
execute function life_os_internal.prevent_relationship_append_only_mutation();

create or replace function life_os_internal.validate_relationship_history()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.relationships
    where relationships.id = new.relationship_id
      and relationships.user_id = new.user_id
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if new.actor_type = 'user'
    and (new.actor_user_id is null or new.actor_user_id <> new.user_id)
  then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if cardinality(new.evidence_ids) > 0
    and exists (
      select 1
      from unnest(new.evidence_ids) as evidence_id
      left join public.relationship_evidence
        on relationship_evidence.id = evidence_id
        and relationship_evidence.relationship_id = new.relationship_id
        and relationship_evidence.user_id = new.user_id
      where relationship_evidence.id is null
    )
  then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function life_os_internal.validate_relationship_history()
from public, anon, authenticated;

create trigger validate_relationship_history
before insert on public.relationship_history
for each row
execute function life_os_internal.validate_relationship_history();

create or replace function life_os_internal.log_relationship_operation(
  p_operation text,
  p_user_id uuid,
  p_relationship_id uuid,
  p_result text,
  p_evidence_count integer default 0,
  p_error_code text default null,
  p_prompt_version text default null,
  p_metrics jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, extensions, pg_temp
as $$
declare
  request_headers_text text := current_setting('request.headers', true);
  request_id text;
begin
  if request_headers_text is not null and request_headers_text <> '' then
    begin
      request_id := request_headers_text::jsonb ->> 'x-request-id';
    exception
      when others then
        request_id := null;
    end;
  end if;

  request_id := coalesce(nullif(request_id, ''), gen_random_uuid()::text);

  raise log '%', jsonb_build_object(
    'operation', left(p_operation, 100),
    'request_id', request_id,
    'user_ref', encode(digest(convert_to(p_user_id::text, 'UTF8'), 'sha256'), 'hex'),
    'relationship_id', p_relationship_id,
    'result', left(p_result, 50),
    'duration_ms', greatest(
      0,
      round(extract(epoch from (clock_timestamp() - statement_timestamp())) * 1000)
    ),
    'evidence_count', greatest(0, coalesce(p_evidence_count, 0)),
    'error_code', p_error_code,
    'prompt_version', p_prompt_version,
    'metrics', coalesce(p_metrics, '{}'::jsonb)
  )::text;
end;
$$;

revoke all on function life_os_internal.log_relationship_operation(
  text, uuid, uuid, text, integer, text, text, jsonb
) from public, anon, authenticated;

create or replace function life_os_internal.record_relationship_history(
  p_relationship_id uuid,
  p_user_id uuid,
  p_action text,
  p_actor_type text,
  p_actor_user_id uuid,
  p_before_state jsonb,
  p_after_state jsonb,
  p_reason text,
  p_evidence_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  insert into public.relationship_history (
    user_id,
    relationship_id,
    action,
    actor_type,
    actor_user_id,
    before_state,
    after_state,
    reason,
    evidence_ids
  ) values (
    p_user_id,
    p_relationship_id,
    p_action,
    p_actor_type,
    p_actor_user_id,
    p_before_state,
    p_after_state,
    nullif(left(trim(coalesce(p_reason, '')), 500), ''),
    coalesce(p_evidence_ids, '{}'::uuid[])
  );

  perform life_os_internal.log_relationship_operation(
    p_action,
    p_user_id,
    p_relationship_id,
    'success',
    cardinality(coalesce(p_evidence_ids, '{}'::uuid[])),
    null,
    null,
    jsonb_strip_nulls(jsonb_build_object(
      'relationships_created', case when p_action = 'created' then 1 end,
      'relationship_evidence_added', case
        when p_action = 'evidence_added'
          then cardinality(coalesce(p_evidence_ids, '{}'::uuid[]))
      end,
      'relationships_promoted', case when p_action = 'promoted' then 1 end,
      'relationships_confirmed', case when p_action = 'confirmed' then 1 end,
      'relationships_rejected', case when p_action = 'rejected' then 1 end,
      'relationships_contradicted', case when p_action = 'contradicted' then 1 end
    ))
  );
end;
$$;

revoke all on function life_os_internal.record_relationship_history(
  uuid, uuid, text, text, uuid, jsonb, jsonb, text, uuid[]
) from public, anon, authenticated;

create or replace function public.confirm_relationship(p_relationship_id uuid)
returns public.relationships
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  previous_relationship public.relationships;
  updated_relationship public.relationships;
  decision_evidence_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select *
  into previous_relationship
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if previous_relationship.status = 'confirmed' then
    return previous_relationship;
  end if;

  if previous_relationship.status not in ('suggested', 'supported', 'contradicted') then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  insert into public.relationship_evidence (
    user_id,
    relationship_id,
    evidence_kind,
    relation_to_claim,
    source_strength,
    source_sensitivity,
    source_fingerprint,
    observed_at
  ) values (
    current_user_id,
    previous_relationship.id,
    'user_decision',
    'supporting',
    'explicit',
    previous_relationship.sensitivity,
    'user-decision:confirm:' || previous_relationship.id::text,
    now()
  )
  on conflict (relationship_id, source_fingerprint, relation_to_claim)
  do update set relationship_id = excluded.relationship_id
  returning id into decision_evidence_id;

  perform set_config('life_os.relationship_operation', 'confirm', true);

  update public.relationships
  set
    status = 'confirmed',
    confidence = 'confirmed',
    last_confirmed_at = now()
  where id = previous_relationship.id
    and user_id = current_user_id
  returning * into updated_relationship;

  perform life_os_internal.record_relationship_history(
    updated_relationship.id,
    current_user_id,
    'confirmed',
    'user',
    current_user_id,
    life_os_internal.relationship_snapshot(previous_relationship),
    life_os_internal.relationship_snapshot(updated_relationship),
    'The user explicitly confirmed this relationship.',
    array[decision_evidence_id]
  );

  return updated_relationship;
end;
$$;

create or replace function public.reject_relationship(
  p_relationship_id uuid,
  p_reason text default null
)
returns public.relationships
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  previous_relationship public.relationships;
  updated_relationship public.relationships;
  decision_evidence_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select *
  into previous_relationship
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if previous_relationship.status = 'archived' then
    raise exception 'RELATIONSHIP_ARCHIVED' using errcode = '22023';
  end if;

  if previous_relationship.status = 'rejected' then
    return previous_relationship;
  end if;

  insert into public.relationship_evidence (
    user_id,
    relationship_id,
    evidence_kind,
    relation_to_claim,
    source_strength,
    source_sensitivity,
    source_fingerprint,
    excerpt,
    observed_at
  ) values (
    current_user_id,
    previous_relationship.id,
    'user_decision',
    'contradicting',
    'explicit',
    previous_relationship.sensitivity,
    'user-decision:reject:' || previous_relationship.id::text,
    nullif(left(trim(coalesce(p_reason, '')), 500), ''),
    now()
  )
  on conflict (relationship_id, source_fingerprint, relation_to_claim)
  do update set relationship_id = excluded.relationship_id
  returning id into decision_evidence_id;

  perform set_config('life_os.relationship_operation', 'reject', true);

  update public.relationships
  set status = 'rejected'
  where id = previous_relationship.id
    and user_id = current_user_id
  returning * into updated_relationship;

  perform life_os_internal.record_relationship_history(
    updated_relationship.id,
    current_user_id,
    'rejected',
    'user',
    current_user_id,
    life_os_internal.relationship_snapshot(previous_relationship),
    life_os_internal.relationship_snapshot(updated_relationship),
    coalesce(nullif(trim(p_reason), ''), 'The user rejected this relationship.'),
    array[decision_evidence_id]
  );

  return updated_relationship;
end;
$$;

create or replace function public.correct_relationship(
  p_relationship_id uuid,
  p_relationship_type text,
  p_source_entity_id uuid,
  p_target_entity_id uuid,
  p_start_date date default null,
  p_end_date date default null,
  p_date_precision text default 'unknown',
  p_reason text default null
)
returns public.relationships
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  previous_relationship public.relationships;
  updated_relationship public.relationships;
  decision_evidence_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_relationship_type not in (
    'participates_in',
    'affiliated_with',
    'located_at',
    'temporally_associated_with',
    'concerns',
    'contributes_to',
    'created',
    'contextually_associated_with'
  ) then
    raise exception 'INVALID_RELATIONSHIP_TYPE' using errcode = '22023';
  end if;

  if p_date_precision not in ('unknown', 'approximate', 'exact') then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  if p_source_entity_id = p_target_entity_id then
    raise exception 'INVALID_DIRECTION' using errcode = '22023';
  end if;

  if p_start_date is not null and p_end_date is not null and p_end_date < p_start_date then
    raise exception 'INVALID_TEMPORAL_RANGE' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.entities
    where entities.id = p_source_entity_id
      and entities.user_id = current_user_id
      and entities.status <> 'deleted'
  ) or not exists (
    select 1
    from public.entities
    where entities.id = p_target_entity_id
      and entities.user_id = current_user_id
      and entities.status <> 'deleted'
  ) then
    raise exception 'ENTITY_OWNERSHIP_MISMATCH' using errcode = '42501';
  end if;

  select *
  into previous_relationship
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if previous_relationship.status = 'archived' then
    raise exception 'RELATIONSHIP_ARCHIVED' using errcode = '22023';
  end if;

  insert into public.relationship_evidence (
    user_id,
    relationship_id,
    evidence_kind,
    relation_to_claim,
    source_strength,
    source_sensitivity,
    source_fingerprint,
    excerpt,
    observed_at
  ) values (
    current_user_id,
    previous_relationship.id,
    'user_decision',
    'supporting',
    'explicit',
    previous_relationship.sensitivity,
    'user-decision:correct:' || previous_relationship.id::text || ':' ||
      life_os_internal.relationship_fingerprint(
        current_user_id,
        least(p_source_entity_id::text, p_target_entity_id::text)::uuid,
        greatest(p_source_entity_id::text, p_target_entity_id::text)::uuid,
        p_relationship_type,
        p_start_date,
        p_end_date
      ),
    nullif(left(trim(coalesce(p_reason, '')), 500), ''),
    now()
  )
  on conflict (relationship_id, source_fingerprint, relation_to_claim)
  do update set relationship_id = excluded.relationship_id
  returning id into decision_evidence_id;

  perform set_config('life_os.relationship_operation', 'correct', true);

  begin
    update public.relationships
    set
      relationship_type = p_relationship_type,
      source_entity_id = p_source_entity_id,
      target_entity_id = p_target_entity_id,
      start_date = p_start_date,
      end_date = p_end_date,
      date_precision = p_date_precision,
      status = 'confirmed',
      confidence = 'confirmed',
      last_confirmed_at = now()
    where id = previous_relationship.id
      and user_id = current_user_id
    returning * into updated_relationship;
  exception
    when unique_violation then
      raise exception 'DUPLICATE_RELATIONSHIP' using errcode = '23505';
  end;

  perform life_os_internal.record_relationship_history(
    updated_relationship.id,
    current_user_id,
    'corrected',
    'user',
    current_user_id,
    life_os_internal.relationship_snapshot(previous_relationship),
    life_os_internal.relationship_snapshot(updated_relationship),
    coalesce(nullif(trim(p_reason), ''), 'The user corrected this relationship.'),
    array[decision_evidence_id]
  );

  return updated_relationship;
end;
$$;

create or replace function public.mark_relationship_outdated(
  p_relationship_id uuid,
  p_end_date date default null,
  p_date_precision text default 'unknown'
)
returns public.relationships
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  previous_relationship public.relationships;
  updated_relationship public.relationships;
  decision_evidence_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_date_precision not in ('unknown', 'approximate', 'exact') then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  select *
  into previous_relationship
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if previous_relationship.status = 'archived' then
    raise exception 'RELATIONSHIP_ARCHIVED' using errcode = '22023';
  end if;

  if p_end_date is not null
    and previous_relationship.start_date is not null
    and p_end_date < previous_relationship.start_date
  then
    raise exception 'INVALID_TEMPORAL_RANGE' using errcode = '22023';
  end if;

  if previous_relationship.status = 'outdated'
    and previous_relationship.end_date is not distinct from p_end_date
    and previous_relationship.date_precision = p_date_precision
  then
    return previous_relationship;
  end if;

  insert into public.relationship_evidence (
    user_id,
    relationship_id,
    evidence_kind,
    relation_to_claim,
    source_strength,
    source_sensitivity,
    source_fingerprint,
    observed_at
  ) values (
    current_user_id,
    previous_relationship.id,
    'user_decision',
    'supporting',
    'explicit',
    previous_relationship.sensitivity,
    'user-decision:outdated:' || previous_relationship.id::text || ':' || coalesce(p_end_date::text, 'unknown'),
    now()
  )
  on conflict (relationship_id, source_fingerprint, relation_to_claim)
  do update set relationship_id = excluded.relationship_id
  returning id into decision_evidence_id;

  perform set_config('life_os.relationship_operation', 'outdate', true);

  update public.relationships
  set
    status = 'outdated',
    end_date = coalesce(p_end_date, end_date),
    date_precision = p_date_precision
  where id = previous_relationship.id
    and user_id = current_user_id
  returning * into updated_relationship;

  perform life_os_internal.record_relationship_history(
    updated_relationship.id,
    current_user_id,
    'marked_outdated',
    'user',
    current_user_id,
    life_os_internal.relationship_snapshot(previous_relationship),
    life_os_internal.relationship_snapshot(updated_relationship),
    'The user marked this relationship as no longer current.',
    array[decision_evidence_id]
  );

  return updated_relationship;
end;
$$;

create or replace function public.set_relationship_visibility(
  p_relationship_id uuid,
  p_is_visible boolean
)
returns public.relationships
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  previous_relationship public.relationships;
  updated_relationship public.relationships;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select *
  into previous_relationship
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if previous_relationship.is_visible = p_is_visible then
    return previous_relationship;
  end if;

  perform set_config('life_os.relationship_operation', 'visibility', true);

  update public.relationships
  set is_visible = p_is_visible
  where id = previous_relationship.id
    and user_id = current_user_id
  returning * into updated_relationship;

  perform life_os_internal.record_relationship_history(
    updated_relationship.id,
    current_user_id,
    'visibility_changed',
    'user',
    current_user_id,
    life_os_internal.relationship_snapshot(previous_relationship),
    life_os_internal.relationship_snapshot(updated_relationship),
    case when p_is_visible
      then 'The user restored this relationship to visible surfaces.'
      else 'The user hid this relationship from the primary graph.'
    end,
    '{}'::uuid[]
  );

  return updated_relationship;
end;
$$;

create or replace function public.archive_relationship(p_relationship_id uuid)
returns public.relationships
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  previous_relationship public.relationships;
  updated_relationship public.relationships;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select *
  into previous_relationship
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if previous_relationship.status = 'contradicted' then
    raise exception 'UNRESOLVED_CONTRADICTION' using errcode = '22023';
  end if;

  if previous_relationship.status = 'archived' then
    return previous_relationship;
  end if;

  perform set_config('life_os.relationship_operation', 'archive', true);

  update public.relationships
  set status = 'archived'
  where id = previous_relationship.id
    and user_id = current_user_id
  returning * into updated_relationship;

  perform life_os_internal.record_relationship_history(
    updated_relationship.id,
    current_user_id,
    'archived',
    'user',
    current_user_id,
    life_os_internal.relationship_snapshot(previous_relationship),
    life_os_internal.relationship_snapshot(updated_relationship),
    'The user archived this relationship without deleting its evidence or history.',
    '{}'::uuid[]
  );

  return updated_relationship;
end;
$$;

create or replace function public.restore_relationship(p_relationship_id uuid)
returns public.relationships
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  previous_relationship public.relationships;
  updated_relationship public.relationships;
  restored_status text;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select *
  into previous_relationship
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if previous_relationship.status <> 'archived' then
    return previous_relationship;
  end if;

  select relationship_history.before_state ->> 'status'
  into restored_status
  from public.relationship_history
  where relationship_history.relationship_id = previous_relationship.id
    and relationship_history.user_id = current_user_id
    and relationship_history.action = 'archived'
  order by relationship_history.created_at desc, relationship_history.id desc
  limit 1;

  if restored_status not in (
    'suggested',
    'supported',
    'confirmed',
    'rejected',
    'contradicted',
    'outdated'
  ) then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  perform set_config('life_os.relationship_operation', 'restore', true);

  begin
    update public.relationships
    set status = restored_status
    where id = previous_relationship.id
      and user_id = current_user_id
    returning * into updated_relationship;
  exception
    when unique_violation then
      raise exception 'DUPLICATE_RELATIONSHIP' using errcode = '23505';
  end;

  perform life_os_internal.record_relationship_history(
    updated_relationship.id,
    current_user_id,
    'restored',
    'user',
    current_user_id,
    life_os_internal.relationship_snapshot(previous_relationship),
    life_os_internal.relationship_snapshot(updated_relationship),
    'The user restored this relationship to its prior canonical state.',
    '{}'::uuid[]
  );

  return updated_relationship;
end;
$$;

create or replace function public.ingest_relationship_candidate(
  p_user_id uuid,
  p_source_entity_id uuid,
  p_target_entity_id uuid,
  p_relationship_type text,
  p_explicitness text,
  p_observation_ids uuid[],
  p_relation_to_claim text default 'supporting',
  p_start_date date default null,
  p_end_date date default null,
  p_date_precision text default 'unknown',
  p_sensitivity text default 'normal',
  p_explanation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  normalized_source_entity_id uuid := p_source_entity_id;
  normalized_target_entity_id uuid := p_target_entity_id;
  swapped_entity_id uuid;
  fingerprint text;
  relationship_sensitivity text := p_sensitivity;
  initial_confidence text;
  initial_status text;
  previous_relationship public.relationships;
  current_relationship public.relationships;
  source_observation record;
  evidence_id uuid;
  inserted_evidence_ids uuid[] := '{}'::uuid[];
  independent_source_count integer := 0;
  created_count integer := 0;
  promoted_count integer := 0;
  contradicted_count integer := 0;
  evidence_hash text;
begin
  if p_user_id is null then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  if p_relationship_type not in (
    'participates_in',
    'affiliated_with',
    'located_at',
    'temporally_associated_with',
    'concerns',
    'contributes_to',
    'created',
    'contextually_associated_with'
  ) then
    raise exception 'INVALID_RELATIONSHIP_TYPE' using errcode = '22023';
  end if;

  if p_explicitness not in ('implicit', 'explicit')
    or p_relation_to_claim not in ('supporting', 'contradicting', 'contextual')
    or p_date_precision not in ('unknown', 'approximate', 'exact')
    or p_sensitivity not in ('normal', 'sensitive', 'highly_sensitive')
  then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  if p_source_entity_id = p_target_entity_id then
    raise exception 'INVALID_DIRECTION' using errcode = '22023';
  end if;

  if p_relation_to_claim = 'contextual'
    and p_relationship_type <> 'contextually_associated_with'
  then
    raise exception 'INVALID_RELATIONSHIP_TYPE' using errcode = '22023';
  end if;

  if p_start_date is not null and p_end_date is not null and p_end_date < p_start_date then
    raise exception 'INVALID_TEMPORAL_RANGE' using errcode = '22023';
  end if;

  if cardinality(p_observation_ids) < 1 or cardinality(p_observation_ids) > 8 then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  if cardinality(p_observation_ids) <> (
    select count(distinct observation_id)
    from unnest(p_observation_ids) as observation_id
  ) then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.entities
    where entities.id = p_source_entity_id
      and entities.user_id = p_user_id
      and entities.status <> 'deleted'
  ) or not exists (
    select 1
    from public.entities
    where entities.id = p_target_entity_id
      and entities.user_id = p_user_id
      and entities.status <> 'deleted'
  ) then
    raise exception 'ENTITY_OWNERSHIP_MISMATCH' using errcode = '42501';
  end if;

  if (
    select count(*)
    from public.observations
    where observations.id = any(p_observation_ids)
      and observations.user_id = p_user_id
      and observations.status <> 'deleted'
  ) <> cardinality(p_observation_ids) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_relationship_type = 'contextually_associated_with'
    and normalized_source_entity_id::text > normalized_target_entity_id::text
  then
    swapped_entity_id := normalized_source_entity_id;
    normalized_source_entity_id := normalized_target_entity_id;
    normalized_target_entity_id := swapped_entity_id;
  end if;

  if exists (
    select 1
    from public.entities
    where entities.id in (normalized_source_entity_id, normalized_target_entity_id)
      and entities.user_id = p_user_id
      and entities.sensitivity = 'sensitive'
  ) and relationship_sensitivity = 'normal' then
    relationship_sensitivity := 'sensitive';
  end if;

  if exists (
    select 1
    from public.observations
    where observations.id = any(p_observation_ids)
      and observations.user_id = p_user_id
      and observations.sensitivity = 'sensitive'
  ) and relationship_sensitivity = 'normal' then
    relationship_sensitivity := 'sensitive';
  end if;

  fingerprint := life_os_internal.relationship_fingerprint(
    p_user_id,
    normalized_source_entity_id,
    normalized_target_entity_id,
    p_relationship_type,
    p_start_date,
    p_end_date
  );

  select *
  into current_relationship
  from public.relationships
  where relationships.user_id = p_user_id
    and relationships.candidate_fingerprint = fingerprint
  order by (relationships.status = 'archived') asc, relationships.updated_at desc
  limit 1
  for update;

  if not found then
    initial_confidence := case when p_explicitness = 'explicit' then 'medium' else 'low' end;
    initial_status := case when p_explicitness = 'explicit' then 'supported' else 'suggested' end;

    perform set_config('life_os.relationship_operation', 'ingest', true);

    begin
      insert into public.relationships (
        user_id,
        source_entity_id,
        target_entity_id,
        relationship_type,
        status,
        confidence,
        sensitivity,
        is_directional,
        start_date,
        end_date,
        date_precision,
        first_observed_at,
        last_observed_at,
        explanation,
        candidate_fingerprint,
        created_by
      )
      select
        p_user_id,
        normalized_source_entity_id,
        normalized_target_entity_id,
        p_relationship_type,
        initial_status,
        initial_confidence,
        relationship_sensitivity,
        p_relationship_type <> 'contextually_associated_with',
        p_start_date,
        p_end_date,
        p_date_precision,
        min(coalesce(observations.created_at, now())),
        max(coalesce(observations.created_at, now())),
        nullif(left(trim(coalesce(p_explanation, '')), 1000), ''),
        repeat('0', 64),
        'ai'
      from public.observations
      where observations.id = any(p_observation_ids)
        and observations.user_id = p_user_id
      returning * into current_relationship;
    exception
      when unique_violation then
        select *
        into current_relationship
        from public.relationships
        where relationships.user_id = p_user_id
          and relationships.candidate_fingerprint = fingerprint
          and relationships.status <> 'archived'
        for update;
    end;

    if current_relationship.id is null then
      raise exception 'DUPLICATE_RELATIONSHIP' using errcode = '23505';
    end if;

    created_count := 1;

    perform life_os_internal.record_relationship_history(
      current_relationship.id,
      p_user_id,
      'created',
      'ai',
      null,
      null,
      life_os_internal.relationship_snapshot(current_relationship),
      'A relationship candidate was created from validated structured output.',
      '{}'::uuid[]
    );
  end if;

  previous_relationship := current_relationship;

  for source_observation in
    select
      observations.id,
      observations.capture_id,
      observations.content,
      observations.sensitivity,
      observations.created_at
    from public.observations
    where observations.id = any(p_observation_ids)
      and observations.user_id = p_user_id
    order by observations.created_at, observations.id
  loop
    evidence_id := null;

    insert into public.relationship_evidence (
      user_id,
      relationship_id,
      evidence_kind,
      capture_id,
      observation_id,
      relation_to_claim,
      source_strength,
      source_sensitivity,
      source_fingerprint,
      excerpt,
      observed_at
    ) values (
      p_user_id,
      current_relationship.id,
      case when p_explicitness = 'explicit' then 'user_declaration' else 'observation' end,
      source_observation.capture_id,
      source_observation.id,
      p_relation_to_claim,
      case
        when p_explicitness = 'explicit' then 'explicit'
        when p_relationship_type = 'contextually_associated_with' then 'weak'
        else 'moderate'
      end,
      case
        when relationship_sensitivity = 'highly_sensitive' then 'highly_sensitive'
        when source_observation.sensitivity = 'sensitive' then 'sensitive'
        else 'normal'
      end,
      case
        when source_observation.capture_id is not null
          then 'capture:' || source_observation.capture_id::text
        else 'observation:' || source_observation.id::text
      end,
      left(source_observation.content, 500),
      source_observation.created_at
    )
    on conflict (relationship_id, source_fingerprint, relation_to_claim)
    do nothing
    returning id into evidence_id;

    if evidence_id is not null then
      inserted_evidence_ids := array_append(inserted_evidence_ids, evidence_id);
    end if;
  end loop;

  select encode(
    extensions.digest(
      convert_to(
        coalesce(string_agg(
          relationship_evidence.source_fingerprint || ':' || relationship_evidence.relation_to_claim,
          ',' order by relationship_evidence.source_fingerprint, relationship_evidence.relation_to_claim
        ), ''),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  )
  into evidence_hash
  from public.relationship_evidence
  where relationship_evidence.relationship_id = current_relationship.id
    and relationship_evidence.user_id = p_user_id;

  perform set_config('life_os.relationship_operation', 'ingest', true);

  update public.relationships
  set
    first_observed_at = least(
      coalesce(first_observed_at, (
        select min(observations.created_at)
        from public.observations
        where observations.id = any(p_observation_ids)
          and observations.user_id = p_user_id
      )),
      (
        select min(observations.created_at)
        from public.observations
        where observations.id = any(p_observation_ids)
          and observations.user_id = p_user_id
      )
    ),
    last_observed_at = greatest(
      coalesce(last_observed_at, '-infinity'::timestamptz),
      (
        select max(observations.created_at)
        from public.observations
        where observations.id = any(p_observation_ids)
          and observations.user_id = p_user_id
      )
    ),
    sensitivity = case
      when sensitivity = 'highly_sensitive' or relationship_sensitivity = 'highly_sensitive'
        then 'highly_sensitive'
      when sensitivity = 'sensitive' or relationship_sensitivity = 'sensitive'
        then 'sensitive'
      else 'normal'
    end,
    explanation = coalesce(explanation, nullif(left(trim(coalesce(p_explanation, '')), 1000), '')),
    evidence_set_hash = evidence_hash
  where id = current_relationship.id
    and user_id = p_user_id
  returning * into current_relationship;

  if cardinality(inserted_evidence_ids) > 0 then
    perform life_os_internal.record_relationship_history(
      current_relationship.id,
      p_user_id,
      'evidence_added',
      'ai',
      null,
      life_os_internal.relationship_snapshot(previous_relationship),
      life_os_internal.relationship_snapshot(current_relationship),
      'New immutable evidence was attached to this relationship.',
      inserted_evidence_ids
    );
  end if;

  previous_relationship := current_relationship;

  if p_relation_to_claim = 'contradicting'
    and current_relationship.status not in ('rejected', 'archived', 'contradicted')
  then
    perform set_config('life_os.relationship_operation', 'ingest', true);

    update public.relationships
    set status = 'contradicted'
    where id = current_relationship.id
      and user_id = p_user_id
    returning * into current_relationship;

    contradicted_count := 1;

    perform life_os_internal.record_relationship_history(
      current_relationship.id,
      p_user_id,
      'contradicted',
      'system',
      null,
      life_os_internal.relationship_snapshot(previous_relationship),
      life_os_internal.relationship_snapshot(current_relationship),
      'Reliable conflicting evidence requires human review.',
      inserted_evidence_ids
    );
  elsif current_relationship.status in ('suggested', 'supported')
    and current_relationship.sensitivity = 'normal'
    and not exists (
      select 1
      from public.relationship_evidence
      where relationship_evidence.relationship_id = current_relationship.id
        and relationship_evidence.user_id = p_user_id
        and relationship_evidence.relation_to_claim = 'contradicting'
    )
  then
    select count(distinct relationship_evidence.source_fingerprint)
    into independent_source_count
    from public.relationship_evidence
    where relationship_evidence.relationship_id = current_relationship.id
      and relationship_evidence.user_id = p_user_id
      and relationship_evidence.source_sensitivity = 'normal'
      and relationship_evidence.relation_to_claim in ('supporting', 'contextual');

    previous_relationship := current_relationship;

    if current_relationship.confidence = 'low' and independent_source_count >= 2 then
      perform set_config('life_os.relationship_operation', 'ingest', true);
      update public.relationships
      set confidence = 'medium', status = 'supported'
      where id = current_relationship.id
        and user_id = p_user_id
      returning * into current_relationship;
      promoted_count := 1;
    elsif current_relationship.confidence = 'medium' and independent_source_count >= 3 then
      perform set_config('life_os.relationship_operation', 'ingest', true);
      update public.relationships
      set confidence = 'high', status = 'supported'
      where id = current_relationship.id
        and user_id = p_user_id
      returning * into current_relationship;
      promoted_count := 1;
    end if;

    if promoted_count = 1 then
      perform life_os_internal.record_relationship_history(
        current_relationship.id,
        p_user_id,
        'promoted',
        'system',
        null,
        life_os_internal.relationship_snapshot(previous_relationship),
        life_os_internal.relationship_snapshot(current_relationship),
        independent_source_count::text || ' independent normal-sensitivity sources support this promotion.',
        inserted_evidence_ids
      );
    end if;
  end if;

  return jsonb_build_object(
    'relationship', to_jsonb(current_relationship),
    'created', created_count,
    'evidence_added', cardinality(inserted_evidence_ids),
    'promoted', promoted_count,
    'contradicted', contradicted_count,
    'skipped', case
      when created_count = 0 and cardinality(inserted_evidence_ids) = 0
        and promoted_count = 0 and contradicted_count = 0
      then 1
      else 0
    end
  );
end;
$$;

create or replace function public.get_focused_graph(
  p_focus_entity_id uuid,
  p_depth integer default 1,
  p_cursor text default null,
  p_limit integer default 12,
  p_include_suggestions boolean default true,
  p_include_historical boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  focus_entity public.entities;
  cursor_parts text[];
  cursor_priority integer;
  cursor_updated_at timestamptz;
  cursor_id uuid;
  effective_limit integer;
  node_limit integer;
  response jsonb;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_depth < 1 or p_depth > 2 or p_limit < 1 or p_limit > 30 then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  select *
  into focus_entity
  from public.entities
  where id = p_focus_entity_id
    and user_id = current_user_id
    and status not in ('hidden', 'archived', 'deleted');

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_cursor is not null then
    cursor_parts := string_to_array(p_cursor, '|');

    if cardinality(cursor_parts) <> 3 then
      raise exception 'INVALID_INPUT' using errcode = '22023';
    end if;

    begin
      cursor_priority := cursor_parts[1]::integer;
      cursor_updated_at := cursor_parts[2]::timestamptz;
      cursor_id := cursor_parts[3]::uuid;
    exception
      when others then
        raise exception 'INVALID_INPUT' using errcode = '22023';
    end;
  end if;

  effective_limit := least(p_limit, case when p_cursor is null then 12 else 20 end);
  node_limit := case when p_cursor is null and p_depth = 1 then 8 else 12 end;

  with recursive traversed as (
    select
      focus_entity.id as entity_id,
      0 as depth,
      array[focus_entity.id]::uuid[] as path

    union all

    select
      case
        when relationships.source_entity_id = traversed.entity_id
          then relationships.target_entity_id
        else relationships.source_entity_id
      end,
      traversed.depth + 1,
      traversed.path || case
        when relationships.source_entity_id = traversed.entity_id
          then relationships.target_entity_id
        else relationships.source_entity_id
      end
    from traversed
    join public.relationships
      on relationships.user_id = current_user_id
      and (
        relationships.source_entity_id = traversed.entity_id
        or relationships.target_entity_id = traversed.entity_id
      )
    join public.entities as source_entity
      on source_entity.id = relationships.source_entity_id
      and source_entity.user_id = current_user_id
      and source_entity.status not in ('hidden', 'archived', 'deleted')
    join public.entities as target_entity
      on target_entity.id = relationships.target_entity_id
      and target_entity.user_id = current_user_id
      and target_entity.status not in ('hidden', 'archived', 'deleted')
    where traversed.depth < p_depth
      and relationships.is_visible = true
      and relationships.sensitivity = 'normal'
      and (
        relationships.status in ('supported', 'confirmed')
        or (p_include_suggestions and relationships.status = 'suggested')
        or (p_include_historical and relationships.status = 'outdated')
      )
      and not (
        case
          when relationships.source_entity_id = traversed.entity_id
            then relationships.target_entity_id
          else relationships.source_entity_id
        end = any(traversed.path)
      )
  ),
  candidate_edges as (
    select distinct on (relationships.id)
      relationships.*,
      case relationships.status
        when 'confirmed' then 1
        when 'supported' then 2
        when 'suggested' then 3
        when 'outdated' then 4
        else 5
      end as status_priority,
      (
        select count(distinct relationship_evidence.source_fingerprint)
        from public.relationship_evidence
        where relationship_evidence.relationship_id = relationships.id
          and relationship_evidence.user_id = current_user_id
          and relationship_evidence.relation_to_claim in ('supporting', 'contextual')
      ) as independent_source_count,
      (
        relationships.start_date is null or relationships.start_date <= current_date
      ) and (
        relationships.end_date is null or relationships.end_date >= current_date
      ) as is_current
    from public.relationships
    join traversed
      on traversed.depth < p_depth
      and (
        relationships.source_entity_id = traversed.entity_id
        or relationships.target_entity_id = traversed.entity_id
      )
    join public.entities as source_entity
      on source_entity.id = relationships.source_entity_id
      and source_entity.user_id = current_user_id
      and source_entity.status not in ('hidden', 'archived', 'deleted')
    join public.entities as target_entity
      on target_entity.id = relationships.target_entity_id
      and target_entity.user_id = current_user_id
      and target_entity.status not in ('hidden', 'archived', 'deleted')
    where relationships.user_id = current_user_id
      and relationships.is_visible = true
      and relationships.sensitivity = 'normal'
      and (
        relationships.status in ('supported', 'confirmed')
        or (p_include_suggestions and relationships.status = 'suggested')
        or (p_include_historical and relationships.status = 'outdated')
      )
    order by relationships.id, traversed.depth
  ),
  node_candidates as (
    select
      entity_id,
      min(status_priority) as best_priority,
      max(updated_at) as latest_update
    from (
      select source_entity_id as entity_id, status_priority, updated_at
      from candidate_edges
      where source_entity_id <> focus_entity.id

      union all

      select target_entity_id as entity_id, status_priority, updated_at
      from candidate_edges
      where target_entity_id <> focus_entity.id
    ) as connected_nodes
    group by entity_id
  ),
  ranked_nodes as (
    select
      node_candidates.entity_id,
      row_number() over (
        order by node_candidates.best_priority, node_candidates.latest_update desc, node_candidates.entity_id
      ) as node_rank
    from node_candidates
  ),
  node_limited_edges as (
    select candidate_edges.*
    from candidate_edges
    where (
      candidate_edges.source_entity_id = focus_entity.id
      or exists (
        select 1
        from ranked_nodes
        where ranked_nodes.entity_id = candidate_edges.source_entity_id
          and ranked_nodes.node_rank <= node_limit
      )
    )
    and (
      candidate_edges.target_entity_id = focus_entity.id
      or exists (
        select 1
        from ranked_nodes
        where ranked_nodes.entity_id = candidate_edges.target_entity_id
          and ranked_nodes.node_rank <= node_limit
      )
    )
  ),
  ordered_edges as (
    select
      node_limited_edges.*,
      case when node_limited_edges.status = 'suggested' then
        row_number() over (
          partition by node_limited_edges.status
          order by
            node_limited_edges.updated_at desc,
            node_limited_edges.independent_source_count desc,
            node_limited_edges.is_current desc,
            node_limited_edges.id
        )
      end as suggestion_rank
    from node_limited_edges
  ),
  cursor_filtered_edges as (
    select ordered_edges.*
    from ordered_edges
    where (ordered_edges.status <> 'suggested' or ordered_edges.suggestion_rank <= 2)
      and (
        cursor_priority is null
        or ordered_edges.status_priority > cursor_priority
        or (
          ordered_edges.status_priority = cursor_priority
          and ordered_edges.updated_at < cursor_updated_at
        )
        or (
          ordered_edges.status_priority = cursor_priority
          and ordered_edges.updated_at = cursor_updated_at
          and ordered_edges.id > cursor_id
        )
      )
    order by
      ordered_edges.status_priority,
      ordered_edges.updated_at desc,
      ordered_edges.independent_source_count desc,
      ordered_edges.is_current desc,
      ordered_edges.id
    limit effective_limit + 1
  ),
  selected_edges as (
    select *
    from cursor_filtered_edges
    order by
      cursor_filtered_edges.status_priority,
      cursor_filtered_edges.updated_at desc,
      cursor_filtered_edges.independent_source_count desc,
      cursor_filtered_edges.is_current desc,
      cursor_filtered_edges.id
    limit effective_limit
  ),
  selected_node_ids as (
    select focus_entity.id as entity_id
    union
    select selected_edges.source_entity_id from selected_edges
    union
    select selected_edges.target_entity_id from selected_edges
  ),
  selected_nodes as (
    select entities.*
    from public.entities
    join selected_node_ids on selected_node_ids.entity_id = entities.id
    where entities.user_id = current_user_id
  ),
  last_edge as (
    select *
    from selected_edges
    order by
      selected_edges.status_priority desc,
      selected_edges.updated_at,
      selected_edges.independent_source_count,
      selected_edges.is_current,
      selected_edges.id desc
    limit 1
  ),
  graph_counts as (
    select
      count(*) filter (
        where relationships.is_visible = true
          and relationships.status in ('supported', 'confirmed')
      ) as visible,
      count(*) filter (where relationships.status = 'suggested') as suggested,
      count(*) filter (where relationships.status = 'contradicted') as contradicted,
      count(*) filter (where relationships.status in ('outdated', 'archived')) as historical
    from public.relationships
    where relationships.user_id = current_user_id
      and (
        relationships.source_entity_id = focus_entity.id
        or relationships.target_entity_id = focus_entity.id
      )
  )
  select jsonb_build_object(
    'focus_entity', to_jsonb(focus_entity) - 'user_id',
    'nodes', coalesce((
      select jsonb_agg(to_jsonb(selected_nodes) - 'user_id' order by
        (selected_nodes.id = focus_entity.id) desc,
        selected_nodes.name,
        selected_nodes.id
      )
      from selected_nodes
    ), '[]'::jsonb),
    'edges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', selected_edges.id,
        'source_entity_id', selected_edges.source_entity_id,
        'target_entity_id', selected_edges.target_entity_id,
        'relationship_type', selected_edges.relationship_type,
        'status', selected_edges.status,
        'display_state', case selected_edges.status
          when 'suggested' then 'suggested'
          when 'supported' then 'supported'
          when 'confirmed' then 'confirmed'
          when 'outdated' then 'past'
          else 'needs_review'
        end,
        'sensitivity', selected_edges.sensitivity,
        'is_directional', selected_edges.is_directional,
        'start_date', selected_edges.start_date,
        'end_date', selected_edges.end_date,
        'date_precision', selected_edges.date_precision,
        'explanation', selected_edges.explanation,
        'updated_at', selected_edges.updated_at
      ) order by
        selected_edges.status_priority,
        selected_edges.updated_at desc,
        selected_edges.independent_source_count desc,
        selected_edges.is_current desc,
        selected_edges.id
      )
      from selected_edges
    ), '[]'::jsonb),
    'page_info', jsonb_build_object(
      'next_cursor', case
        when (select count(*) from cursor_filtered_edges) > effective_limit
        then (
          select
            last_edge.status_priority::text || '|' ||
            to_char(last_edge.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z|' ||
            last_edge.id::text
          from last_edge
        )
        else null
      end,
      'has_more', (select count(*) from cursor_filtered_edges) > effective_limit
    ),
    'counts', jsonb_build_object(
      'visible', graph_counts.visible,
      'suggested', graph_counts.suggested,
      'contradicted', graph_counts.contradicted,
      'historical', graph_counts.historical
    )
  )
  into response
  from graph_counts;

  perform life_os_internal.log_relationship_operation(
    'get_focused_graph',
    current_user_id,
    null,
    'success',
    0,
    null,
    null,
    jsonb_build_object(
      'graph_query_duration', greatest(
        0,
        round(extract(epoch from (clock_timestamp() - statement_timestamp())) * 1000)
      ),
      'graph_query_node_count', jsonb_array_length(response -> 'nodes'),
      'graph_query_edge_count', jsonb_array_length(response -> 'edges')
    )
  );

  return response;
end;
$$;

create or replace function public.get_relationship_detail(
  p_relationship_id uuid,
  p_evidence_cursor text default null,
  p_history_cursor text default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  relationship_record public.relationships;
  source_entity public.entities;
  target_entity public.entities;
  evidence_cursor_parts text[];
  evidence_cursor_created_at timestamptz;
  evidence_cursor_id uuid;
  history_cursor_parts text[];
  history_cursor_created_at timestamptz;
  history_cursor_id uuid;
  response jsonb;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_limit < 1 or p_limit > 100 then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  if p_evidence_cursor is not null then
    evidence_cursor_parts := string_to_array(p_evidence_cursor, '|');
    if cardinality(evidence_cursor_parts) <> 2 then
      raise exception 'INVALID_INPUT' using errcode = '22023';
    end if;
    begin
      evidence_cursor_created_at := evidence_cursor_parts[1]::timestamptz;
      evidence_cursor_id := evidence_cursor_parts[2]::uuid;
    exception
      when others then
        raise exception 'INVALID_INPUT' using errcode = '22023';
    end;
  end if;

  if p_history_cursor is not null then
    history_cursor_parts := string_to_array(p_history_cursor, '|');
    if cardinality(history_cursor_parts) <> 2 then
      raise exception 'INVALID_INPUT' using errcode = '22023';
    end if;
    begin
      history_cursor_created_at := history_cursor_parts[1]::timestamptz;
      history_cursor_id := history_cursor_parts[2]::uuid;
    exception
      when others then
        raise exception 'INVALID_INPUT' using errcode = '22023';
    end;
  end if;

  select *
  into relationship_record
  from public.relationships
  where id = p_relationship_id
    and user_id = current_user_id;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into source_entity
  from public.entities
  where id = relationship_record.source_entity_id
    and user_id = current_user_id;

  select * into target_entity
  from public.entities
  where id = relationship_record.target_entity_id
    and user_id = current_user_id;

  if source_entity.id is null or target_entity.id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  with evidence_candidates as (
    select relationship_evidence.*
    from public.relationship_evidence
    where relationship_evidence.relationship_id = relationship_record.id
      and relationship_evidence.user_id = current_user_id
      and (
        evidence_cursor_created_at is null
        or relationship_evidence.created_at < evidence_cursor_created_at
        or (
          relationship_evidence.created_at = evidence_cursor_created_at
          and relationship_evidence.id < evidence_cursor_id
        )
      )
    order by relationship_evidence.created_at desc, relationship_evidence.id desc
    limit p_limit + 1
  ),
  evidence_page as (
    select * from evidence_candidates
    order by evidence_candidates.created_at desc, evidence_candidates.id desc
    limit p_limit
  ),
  evidence_last as (
    select * from evidence_page
    order by evidence_page.created_at, evidence_page.id
    limit 1
  ),
  history_candidates as (
    select relationship_history.*
    from public.relationship_history
    where relationship_history.relationship_id = relationship_record.id
      and relationship_history.user_id = current_user_id
      and (
        history_cursor_created_at is null
        or relationship_history.created_at < history_cursor_created_at
        or (
          relationship_history.created_at = history_cursor_created_at
          and relationship_history.id < history_cursor_id
        )
      )
    order by relationship_history.created_at desc, relationship_history.id desc
    limit p_limit + 1
  ),
  history_page as (
    select * from history_candidates
    order by history_candidates.created_at desc, history_candidates.id desc
    limit p_limit
  ),
  history_last as (
    select * from history_page
    order by history_page.created_at, history_page.id
    limit 1
  ),
  evidence_summary as (
    select
      count(*) filter (where relation_to_claim = 'supporting') as supporting,
      count(*) filter (where relation_to_claim = 'contradicting') as contradicting,
      count(*) filter (where relation_to_claim = 'contextual') as contextual,
      count(distinct source_fingerprint) as independent_sources
    from public.relationship_evidence
    where relationship_id = relationship_record.id
      and user_id = current_user_id
  )
  select jsonb_build_object(
    'relationship', to_jsonb(relationship_record) - 'user_id',
    'source_entity', to_jsonb(source_entity) - 'user_id',
    'target_entity', to_jsonb(target_entity) - 'user_id',
    'evidence_summary', jsonb_build_object(
      'supporting', evidence_summary.supporting,
      'contradicting', evidence_summary.contradicting,
      'contextual', evidence_summary.contextual,
      'independent_sources', evidence_summary.independent_sources
    ),
    'evidence', coalesce((
      select jsonb_agg(to_jsonb(evidence_page) - 'user_id' order by evidence_page.created_at desc, evidence_page.id desc)
      from evidence_page
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(to_jsonb(history_page) - 'user_id' order by history_page.created_at desc, history_page.id desc)
      from history_page
    ), '[]'::jsonb),
    'contradictions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', relationship_evidence.id,
        'excerpt', relationship_evidence.excerpt,
        'observed_at', relationship_evidence.observed_at,
        'source_strength', relationship_evidence.source_strength
      ) order by relationship_evidence.created_at desc)
      from public.relationship_evidence
      where relationship_evidence.relationship_id = relationship_record.id
        and relationship_evidence.user_id = current_user_id
        and relationship_evidence.relation_to_claim = 'contradicting'
    ), '[]'::jsonb),
    'actions', jsonb_build_object(
      'can_confirm', relationship_record.status in ('suggested', 'supported', 'contradicted'),
      'can_reject', relationship_record.status <> 'archived',
      'can_correct', relationship_record.status <> 'archived',
      'can_mark_outdated', relationship_record.status <> 'archived',
      'can_set_visibility', true,
      'can_archive', relationship_record.status not in ('contradicted', 'archived'),
      'can_restore', relationship_record.status = 'archived'
    ),
    'page_info', jsonb_build_object(
      'evidence_next_cursor', case
        when (select count(*) from evidence_candidates) > p_limit then (
          select
            to_char(evidence_last.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z|' ||
            evidence_last.id::text
          from evidence_last
        ) else null
      end,
      'evidence_has_more', (select count(*) from evidence_candidates) > p_limit,
      'history_next_cursor', case
        when (select count(*) from history_candidates) > p_limit then (
          select
            to_char(history_last.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z|' ||
            history_last.id::text
          from history_last
        ) else null
      end,
      'history_has_more', (select count(*) from history_candidates) > p_limit
    )
  )
  into response
  from evidence_summary;

  perform life_os_internal.log_relationship_operation(
    'get_relationship_detail',
    current_user_id,
    relationship_record.id,
    'success',
    jsonb_array_length(response -> 'evidence')
  );

  return response;
end;
$$;

create or replace function public.get_relationship_review_queue(
  p_filter text default 'suggestions',
  p_cursor text default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  cursor_parts text[];
  cursor_updated_at timestamptz;
  cursor_id uuid;
  response jsonb;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_filter not in ('suggestions', 'contradictions', 'sensitive', 'rejected_with_new_evidence')
    or p_limit < 1 or p_limit > 30
  then
    raise exception 'INVALID_INPUT' using errcode = '22023';
  end if;

  if p_cursor is not null then
    cursor_parts := string_to_array(p_cursor, '|');
    if cardinality(cursor_parts) <> 2 then
      raise exception 'INVALID_INPUT' using errcode = '22023';
    end if;
    begin
      cursor_updated_at := cursor_parts[1]::timestamptz;
      cursor_id := cursor_parts[2]::uuid;
    exception
      when others then
        raise exception 'INVALID_INPUT' using errcode = '22023';
    end;
  end if;

  with candidates as (
    select
      relationships.*,
      source_entity.name as source_name,
      source_entity.type as source_type,
      target_entity.name as target_name,
      target_entity.type as target_type,
      (
        select count(*)
        from public.relationship_evidence
        where relationship_evidence.relationship_id = relationships.id
          and relationship_evidence.user_id = current_user_id
      ) as evidence_count,
      (
        select max(relationship_evidence.created_at)
        from public.relationship_evidence
        where relationship_evidence.relationship_id = relationships.id
          and relationship_evidence.user_id = current_user_id
      ) as latest_evidence_at
    from public.relationships
    join public.entities as source_entity
      on source_entity.id = relationships.source_entity_id
      and source_entity.user_id = current_user_id
    join public.entities as target_entity
      on target_entity.id = relationships.target_entity_id
      and target_entity.user_id = current_user_id
    where relationships.user_id = current_user_id
      and (
        (p_filter = 'suggestions' and relationships.status = 'suggested')
        or (p_filter = 'contradictions' and relationships.status = 'contradicted')
        or (
          p_filter = 'sensitive'
          and relationships.sensitivity in ('sensitive', 'highly_sensitive')
          and relationships.status in ('suggested', 'supported', 'contradicted')
        )
        or (
          p_filter = 'rejected_with_new_evidence'
          and relationships.status = 'rejected'
          and exists (
            select 1
            from public.relationship_evidence
            where relationship_evidence.relationship_id = relationships.id
              and relationship_evidence.user_id = current_user_id
              and relationship_evidence.relation_to_claim = 'supporting'
              and relationship_evidence.source_strength in ('strong', 'explicit')
              and relationship_evidence.created_at > coalesce((
                select max(relationship_history.created_at)
                from public.relationship_history
                where relationship_history.relationship_id = relationships.id
                  and relationship_history.user_id = current_user_id
                  and relationship_history.action = 'rejected'
              ), '-infinity'::timestamptz)
          )
        )
      )
      and (
        cursor_updated_at is null
        or relationships.updated_at < cursor_updated_at
        or (
          relationships.updated_at = cursor_updated_at
          and relationships.id < cursor_id
        )
      )
    order by relationships.updated_at desc, relationships.id desc
    limit p_limit + 1
  ),
  page as (
    select * from candidates
    order by candidates.updated_at desc, candidates.id desc
    limit p_limit
  ),
  last_item as (
    select * from page
    order by page.updated_at, page.id
    limit 1
  )
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'relationship', to_jsonb(page) - array[
          'user_id',
          'source_name',
          'source_type',
          'target_name',
          'target_type',
          'evidence_count',
          'latest_evidence_at'
        ],
        'source_entity', jsonb_build_object(
          'id', page.source_entity_id,
          'name', page.source_name,
          'type', page.source_type
        ),
        'target_entity', jsonb_build_object(
          'id', page.target_entity_id,
          'name', page.target_name,
          'type', page.target_type
        ),
        'evidence_count', page.evidence_count,
        'latest_evidence_at', page.latest_evidence_at
      ) order by page.updated_at desc, page.id desc)
      from page
    ), '[]'::jsonb),
    'page_info', jsonb_build_object(
      'next_cursor', case
        when (select count(*) from candidates) > p_limit then (
          select
            to_char(last_item.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z|' ||
            last_item.id::text
          from last_item
        ) else null
      end,
      'has_more', (select count(*) from candidates) > p_limit
    )
  ) into response;

  perform life_os_internal.log_relationship_operation(
    'get_relationship_review_queue',
    current_user_id,
    null,
    'success',
    0,
    null,
    null,
    jsonb_build_object('review_queue_count', jsonb_array_length(response -> 'items'))
  );

  return response;
end;
$$;

revoke all on function public.confirm_relationship(uuid) from public, anon;
revoke all on function public.reject_relationship(uuid, text) from public, anon;
revoke all on function public.correct_relationship(uuid, text, uuid, uuid, date, date, text, text) from public, anon;
revoke all on function public.mark_relationship_outdated(uuid, date, text) from public, anon;
revoke all on function public.set_relationship_visibility(uuid, boolean) from public, anon;
revoke all on function public.archive_relationship(uuid) from public, anon;
revoke all on function public.restore_relationship(uuid) from public, anon;
revoke all on function public.get_focused_graph(uuid, integer, text, integer, boolean, boolean) from public, anon;
revoke all on function public.get_relationship_detail(uuid, text, text, integer) from public, anon;
revoke all on function public.get_relationship_review_queue(text, text, integer) from public, anon;

grant execute on function public.confirm_relationship(uuid) to authenticated;
grant execute on function public.reject_relationship(uuid, text) to authenticated;
grant execute on function public.correct_relationship(uuid, text, uuid, uuid, date, date, text, text) to authenticated;
grant execute on function public.mark_relationship_outdated(uuid, date, text) to authenticated;
grant execute on function public.set_relationship_visibility(uuid, boolean) to authenticated;
grant execute on function public.archive_relationship(uuid) to authenticated;
grant execute on function public.restore_relationship(uuid) to authenticated;
grant execute on function public.get_focused_graph(uuid, integer, text, integer, boolean, boolean) to authenticated;
grant execute on function public.get_relationship_detail(uuid, text, text, integer) to authenticated;
grant execute on function public.get_relationship_review_queue(text, text, integer) to authenticated;

revoke all on function public.ingest_relationship_candidate(
  uuid, uuid, uuid, text, text, uuid[], text, date, date, text, text, text
) from public, anon, authenticated;

grant execute on function public.ingest_relationship_candidate(
  uuid, uuid, uuid, text, text, uuid[], text, date, date, text, text, text
) to service_role;
