alter table public.entity_duplicate_candidates
  drop constraint entity_duplicate_candidates_distinct_check,
  drop constraint entity_duplicate_candidates_unique_pair,
  alter column entity_id drop not null,
  add column candidate_name text;

alter table public.entity_duplicate_candidates
  add constraint entity_duplicate_candidates_target_check
  check (
    (
      entity_id is not null
      and candidate_name is null
      and entity_id <> duplicate_entity_id
    )
    or (
      entity_id is null
      and candidate_name is not null
      and length(trim(candidate_name)) > 0
    )
  );

alter table public.entity_duplicate_candidates
  add constraint entity_duplicate_candidates_unique_entity_pair
  unique (user_id, entity_id, duplicate_entity_id);

alter table public.entity_duplicate_candidates
  add constraint entity_duplicate_candidates_unique_candidate_reference
  unique (user_id, candidate_name, duplicate_entity_id);
