create extension if not exists pgcrypto with schema extensions;

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_entity_id uuid not null references public.entities(id) on delete restrict,
  target_entity_id uuid not null references public.entities(id) on delete restrict,
  relationship_type text not null,
  status text not null default 'suggested',
  confidence text not null default 'low',
  sensitivity text not null default 'normal',
  is_directional boolean not null,
  is_visible boolean not null default true,
  start_date date,
  end_date date,
  date_precision text not null default 'unknown',
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  last_confirmed_at timestamptz,
  explanation text,
  candidate_fingerprint text not null,
  evidence_set_hash text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint relationships_distinct_entities_check
    check (source_entity_id <> target_entity_id),
  constraint relationships_type_check
    check (relationship_type in (
      'participates_in',
      'affiliated_with',
      'located_at',
      'temporally_associated_with',
      'concerns',
      'contributes_to',
      'created',
      'contextually_associated_with'
    )),
  constraint relationships_status_check
    check (status in (
      'suggested',
      'supported',
      'confirmed',
      'rejected',
      'contradicted',
      'outdated',
      'archived'
    )),
  constraint relationships_confidence_check
    check (confidence in ('low', 'medium', 'high', 'confirmed')),
  constraint relationships_sensitivity_check
    check (sensitivity in ('normal', 'sensitive', 'highly_sensitive')),
  constraint relationships_date_precision_check
    check (date_precision in ('unknown', 'approximate', 'exact')),
  constraint relationships_created_by_check
    check (created_by in ('ai', 'deterministic', 'user', 'migration')),
  constraint relationships_temporal_range_check
    check (end_date is null or start_date is null or end_date >= start_date),
  constraint relationships_direction_check
    check (
      (relationship_type = 'contextually_associated_with' and is_directional = false)
      or
      (relationship_type <> 'contextually_associated_with' and is_directional = true)
    ),
  constraint relationships_confirmed_status_check
    check (status <> 'confirmed' or confidence = 'confirmed'),
  constraint relationships_archived_at_check
    check (status <> 'archived' or archived_at is not null),
  constraint relationships_fingerprint_check
    check (length(trim(candidate_fingerprint)) = 64)
);

create unique index relationships_active_fingerprint_uidx
on public.relationships (user_id, candidate_fingerprint)
where status <> 'archived';

create index relationships_user_source_idx
on public.relationships (user_id, source_entity_id, status);

create index relationships_user_target_idx
on public.relationships (user_id, target_entity_id, status);

create index relationships_user_status_idx
on public.relationships (user_id, status, updated_at desc);

create index relationships_user_visibility_idx
on public.relationships (user_id, is_visible, status)
where is_visible = true;

create index relationships_temporal_idx
on public.relationships (user_id, start_date, end_date);

create index relationships_review_idx
on public.relationships (user_id, updated_at desc)
where status in ('suggested', 'contradicted');

create index relationships_current_graph_idx
on public.relationships (user_id, updated_at desc)
where status in ('supported', 'confirmed')
  and is_visible = true;

create table public.relationship_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  evidence_kind text not null,
  capture_id uuid references public.captures(id) on delete restrict,
  observation_id uuid references public.observations(id) on delete restrict,
  memory_id uuid references public.memories(id) on delete restrict,
  relation_to_claim text not null,
  source_strength text not null,
  source_sensitivity text not null,
  source_fingerprint text not null,
  excerpt text,
  observed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint relationship_evidence_kind_check
    check (evidence_kind in (
      'capture',
      'observation',
      'memory',
      'user_declaration',
      'user_decision',
      'deterministic'
    )),
  constraint relationship_evidence_relation_check
    check (relation_to_claim in ('supporting', 'contradicting', 'contextual')),
  constraint relationship_evidence_strength_check
    check (source_strength in ('weak', 'moderate', 'strong', 'explicit')),
  constraint relationship_evidence_sensitivity_check
    check (source_sensitivity in ('normal', 'sensitive', 'highly_sensitive')),
  constraint relationship_evidence_source_fingerprint_check
    check (length(trim(source_fingerprint)) > 0),
  constraint relationship_evidence_excerpt_check
    check (excerpt is null or length(excerpt) <= 500),
  constraint relationship_evidence_source_check
    check (
      (
        evidence_kind = 'capture'
        and capture_id is not null
        and observation_id is null
        and memory_id is null
      )
      or
      (
        evidence_kind in ('observation', 'user_declaration')
        and observation_id is not null
        and memory_id is null
      )
      or
      (
        evidence_kind = 'memory'
        and memory_id is not null
        and capture_id is null
        and observation_id is null
      )
      or
      (
        evidence_kind in ('user_decision', 'deterministic')
        and capture_id is null
        and observation_id is null
        and memory_id is null
      )
    )
);

create unique index relationship_evidence_source_uidx
on public.relationship_evidence (
  relationship_id,
  source_fingerprint,
  relation_to_claim
);

create index relationship_evidence_relationship_idx
on public.relationship_evidence (relationship_id, created_at);

create index relationship_evidence_capture_idx
on public.relationship_evidence (user_id, capture_id)
where capture_id is not null;

create index relationship_evidence_observation_idx
on public.relationship_evidence (user_id, observation_id)
where observation_id is not null;

create index relationship_evidence_memory_idx
on public.relationship_evidence (user_id, memory_id)
where memory_id is not null;

create table public.relationship_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  action text not null,
  actor_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  evidence_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  constraint relationship_history_action_check
    check (action in (
      'created',
      'evidence_added',
      'promoted',
      'confirmed',
      'corrected',
      'rejected',
      'contradicted',
      'contradiction_cleared',
      'marked_outdated',
      'visibility_changed',
      'archived',
      'restored',
      'temporal_context_changed'
    )),
  constraint relationship_history_actor_type_check
    check (actor_type in ('user', 'ai', 'system', 'migration', 'service_role'))
);

create index relationship_history_relationship_idx
on public.relationship_history (relationship_id, created_at desc);

create index relationship_history_user_idx
on public.relationship_history (user_id, created_at desc);
