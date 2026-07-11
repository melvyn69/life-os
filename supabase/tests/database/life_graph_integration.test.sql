begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, aud, role, email)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'user-a@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'user-b@example.test');

insert into public.captures (id, user_id, content, status, sensitivity, source)
values
  ('10000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Explicit collaboration statement.', 'archived', 'normal', 'text'),
  ('20000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Independent supporting context.', 'archived', 'normal', 'text'),
  ('30000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Third independent supporting context.', 'archived', 'normal', 'text'),
  ('40000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Sensitive private context.', 'archived', 'sensitive', 'text'),
  ('50000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Materially new evidence after rejection.', 'archived', 'normal', 'text'),
  ('b0000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Other user context.', 'archived', 'normal', 'text');

insert into public.observations (id, user_id, capture_id, content, type, confidence, sensitivity, status)
values
  ('11000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '10000000-0000-4000-8000-000000000001', 'Sarah explicitly helps build Life OS.', 'relationship', 'high', 'normal', 'suggested'),
  ('12000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '10000000-0000-4000-8000-000000000001', 'A duplicate signal from the same capture.', 'relationship', 'medium', 'normal', 'suggested'),
  ('21000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '20000000-0000-4000-8000-000000000002', 'Independent relationship evidence.', 'relationship', 'medium', 'normal', 'suggested'),
  ('31000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '30000000-0000-4000-8000-000000000003', 'Third independent relationship evidence.', 'relationship', 'medium', 'normal', 'suggested'),
  ('41000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '40000000-0000-4000-8000-000000000004', 'Sensitive private evidence.', 'relationship', 'medium', 'sensitive', 'suggested'),
  ('51000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '50000000-0000-4000-8000-000000000005', 'New explicit support after rejection.', 'relationship', 'high', 'normal', 'suggested'),
  ('b1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b0000000-0000-4000-8000-000000000001', 'Other user observation.', 'relationship', 'medium', 'normal', 'suggested');

insert into public.entities (id, user_id, name, type, description, confidence, sensitivity, status)
values
  ('a1000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Sarah', 'person', null, 'high', 'normal', 'active'),
  ('a2000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Life OS', 'project', null, 'high', 'normal', 'active'),
  ('a3000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Private place', 'place', null, 'high', 'sensitive', 'active'),
  ('a4000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Marc', 'person', null, 'high', 'normal', 'active'),
  ('b1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Other user entity', 'person', null, 'high', 'normal', 'active');

select is(
  length(life_os_internal.relationship_fingerprint(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'contributes_to', null, null
  )),
  64,
  'fingerprints are fixed-length SHA-256 values'
);

select isnt(
  life_os_internal.relationship_fingerprint(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'contributes_to', null, null
  ),
  life_os_internal.relationship_fingerprint(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'contributes_to', '2026-01-01', null
  ),
  'temporal context participates in the fingerprint'
);

select isnt(
  life_os_internal.relationship_fingerprint(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'contributes_to', null, null
  ),
  life_os_internal.relationship_fingerprint(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a2000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000001',
    'contributes_to', null, null
  ),
  'directional relationship fingerprints preserve source and target order'
);

set local role service_role;

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'contributes_to',
    'explicit',
    array['11000000-0000-4000-8000-000000000001'::uuid],
    'supporting', null, null, 'unknown', 'normal',
    'Sarah explicitly helps build Life OS.'
  )
$sql$, 'an explicit relationship candidate is created');

select is(
  (select status from public.relationships where relationship_type = 'contributes_to'),
  'supported',
  'an explicit AI candidate is supported but never confirmed'
);

select is(
  (select confidence from public.relationships where relationship_type = 'contributes_to'),
  'medium',
  'an explicit AI candidate starts at medium confidence'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'contributes_to', 'explicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'retrying the same relationship is safe');

select is(
  (select count(*)::integer from public.relationships where relationship_type = 'contributes_to'),
  1,
  'relationship creation is idempotent'
);

select is(
  (select count(*)::integer from public.relationship_evidence evidence join public.relationships relationship on relationship.id = evidence.relationship_id where relationship.relationship_type = 'contributes_to' and evidence.evidence_kind = 'user_declaration'),
  1,
  'relationship evidence is idempotent'
);

select is(
  (select count(*)::integer from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.relationship_type = 'contributes_to' and history.action = 'created'),
  1,
  'relationship creation history is idempotent'
);

select throws_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'concerns', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, '22023', 'INVALID_DIRECTION', 'self-relationships are rejected');

select throws_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'concerns', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, '42501', 'ENTITY_OWNERSHIP_MISMATCH', 'cross-user entities are rejected');

select throws_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'contributes_to', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid],
    'contextual'
  )
$sql$, '22023', 'INVALID_RELATIONSHIP_TYPE', 'context-only evidence cannot create an unproven causal relationship');

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000003',
    'contextually_associated_with', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'a non-directional candidate is created');

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a3000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000001',
    'contextually_associated_with', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'the reverse non-directional candidate normalizes safely');

select is(
  (select count(*)::integer from public.relationships where relationship_type = 'contextually_associated_with'),
  1,
  'reversed non-directional duplicates are prevented'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'concerns', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'a low-confidence candidate is created');

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'concerns', 'implicit',
    array['12000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'same-capture evidence can be attached');

select is(
  (select confidence from public.relationships where relationship_type = 'concerns'),
  'low',
  'same-capture evidence is only one independent source'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'concerns', 'implicit',
    array['21000000-0000-4000-8000-000000000002'::uuid]
  )
$sql$, 'second independent source is ingested');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'concerns' $sql$,
  $sql$ values ('medium'::text, 'supported'::text) $sql$,
  'two independent sources promote low to medium and supported'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'concerns', 'implicit',
    array['31000000-0000-4000-8000-000000000003'::uuid]
  )
$sql$, 'third independent source is ingested');

select is(
  (select confidence from public.relationships where relationship_type = 'concerns'),
  'high',
  'three independent sources promote medium to high'
);

select throws_ok($sql$
  with operation as (
    select set_config('life_os.relationship_operation', 'ingest', true)
  )
  update public.relationships
  set confidence = 'medium'
  from operation
  where relationship_type = 'concerns'
$sql$, '42501', 'FORBIDDEN', 'even an ingest operation cannot lower relationship confidence');

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a2000000-0000-4000-8000-000000000002',
    'a3000000-0000-4000-8000-000000000003',
    'located_at', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid, '21000000-0000-4000-8000-000000000002'::uuid, '31000000-0000-4000-8000-000000000003'::uuid],
    'supporting', null, null, 'unknown', 'normal'
  )
$sql$, 'sensitive relationship evidence is ingested');

select results_eq(
  $sql$ select sensitivity, confidence, status from public.relationships where relationship_type = 'located_at' $sql$,
  $sql$ values ('sensitive'::text, 'low'::text, 'suggested'::text) $sql$,
  'maximum sensitivity is applied and automatic promotion is blocked'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'created', 'implicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'a low-confidence candidate is prepared for contradiction testing');

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'created', 'implicit',
    array['21000000-0000-4000-8000-000000000002'::uuid],
    'contradicting'
  )
$sql$, 'contradicting evidence is attached before promotion');

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'created', 'implicit',
    array['31000000-0000-4000-8000-000000000003'::uuid]
  )
$sql$, 'support remains preserved after a contradiction');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'created' $sql$,
  $sql$ values ('low'::text, 'contradicted'::text) $sql$,
  'unresolved contradiction blocks automatic confidence promotion'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    'affiliated_with', 'explicit',
    array['11000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'a relationship is prepared for user confirmation');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select lives_ok($sql$
  select public.confirm_relationship((select id from public.relationships where relationship_type = 'affiliated_with'))
$sql$, 'the user can confirm an owned relationship');

select lives_ok($sql$
  select public.confirm_relationship((select id from public.relationships where relationship_type = 'affiliated_with'))
$sql$, 'repeating confirmation of an already confirmed relationship is idempotent');

select is(
  (select count(*)::integer from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.relationship_type = 'affiliated_with' and history.action = 'confirmed'),
  1,
  'repeated confirmation does not append duplicate history'
);

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'affiliated_with' $sql$,
  $sql$ values ('confirmed'::text, 'confirmed'::text) $sql$,
  'confirmation sets both status and confidence to confirmed'
);

reset role;
set local role service_role;

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    'affiliated_with', 'explicit',
    array['21000000-0000-4000-8000-000000000002'::uuid],
    'contradicting'
  )
$sql$, 'contradicting evidence is preserved');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'affiliated_with' $sql$,
  $sql$ values ('confirmed'::text, 'contradicted'::text) $sql$,
  'contradiction changes status without lowering confirmed confidence'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select lives_ok($sql$
  select public.confirm_relationship((select id from public.relationships where relationship_type = 'affiliated_with'))
$sql$, 'the user can explicitly reconfirm a contradicted relationship');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'affiliated_with' $sql$,
  $sql$ values ('confirmed'::text, 'confirmed'::text) $sql$,
  'reconfirmation restores confirmed status without changing confirmed confidence'
);

select is(
  (select count(*)::integer from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.relationship_type = 'affiliated_with' and history.action = 'confirmed'),
  2,
  'reconfirmation appends one new decision history entry'
);

select is(
  (select count(*)::integer from public.relationship_evidence evidence join public.relationships relationship on relationship.id = evidence.relationship_id where relationship.relationship_type = 'affiliated_with' and evidence.evidence_kind = 'user_decision' and evidence.relation_to_claim = 'supporting'),
  2,
  'reconfirmation after a contradiction appends distinct immutable decision evidence'
);

reset role;
set local role service_role;

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    'affiliated_with', 'explicit',
    array['21000000-0000-4000-8000-000000000002'::uuid],
    'contradicting'
  )
$sql$, 'retrying already ingested contradictory evidence is idempotent');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'affiliated_with' $sql$,
  $sql$ values ('confirmed'::text, 'confirmed'::text) $sql$,
  'an ingestion retry cannot undo an explicit user reconfirmation'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    'affiliated_with', 'explicit',
    array['31000000-0000-4000-8000-000000000003'::uuid],
    'contradicting'
  )
$sql$, 'new contradictory evidence can require review again after reconfirmation');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select throws_ok($sql$
  select public.archive_relationship((select id from public.relationships where relationship_type = 'affiliated_with'))
$sql$, '22023', 'UNRESOLVED_CONTRADICTION', 'a contradicted relationship cannot be archived');

select lives_ok($sql$
  select public.correct_relationship(
    (select id from public.relationships where relationship_type = 'affiliated_with'),
    'participates_in',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    null, null, 'unknown', 'The user corrected the relationship type.'
  )
$sql$, 'the user can explicitly correct a contradiction');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'participates_in' $sql$,
  $sql$ values ('confirmed'::text, 'confirmed'::text) $sql$,
  'a correction produces a confirmed canonical state'
);

select ok(
  (select count(*) > 0 from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.relationship_type = 'participates_in' and history.action = 'corrected' and history.before_state is not null and history.after_state is not null),
  'correction history preserves before and after states'
);

select lives_ok($sql$
  select public.correct_relationship(
    (select id from public.relationships where relationship_type = 'participates_in'),
    'participates_in',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    null, null, 'unknown', 'The user corrected the relationship type.'
  )
$sql$, 'repeating the same canonical correction is idempotent');

select is(
  (select count(*)::integer from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.relationship_type = 'participates_in' and history.action = 'corrected'),
  1,
  'repeating a correction does not append duplicate history'
);

select lives_ok($sql$
  select public.correct_relationship(
    (select id from public.relationships where relationship_type = 'created'),
    'temporally_associated_with',
    'a1000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000003',
    null, null, 'unknown', 'The user corrected the target entity.'
  )
$sql$, 'a user correction can point to another owned entity');

select results_eq(
  $sql$ select sensitivity, confidence, status from public.relationships where relationship_type = 'temporally_associated_with' $sql$,
  $sql$ values ('sensitive'::text, 'confirmed'::text, 'confirmed'::text) $sql$,
  'server-side correction recalculates maximum sensitivity without lowering confidence'
);

select lives_ok($sql$
  select public.mark_relationship_outdated(
    (select id from public.relationships where relationship_type = 'participates_in'),
    '2026-06-30', 'exact'
  )
$sql$, 'the user can mark a relationship outdated');

select results_eq(
  $sql$ select confidence, status, end_date::text from public.relationships where relationship_type = 'participates_in' $sql$,
  $sql$ values ('confirmed'::text, 'outdated'::text, '2026-06-30'::text) $sql$,
  'outdated status preserves confirmed confidence and the end date'
);

select lives_ok($sql$
  select public.mark_relationship_outdated(
    (select id from public.relationships where relationship_type = 'participates_in'),
    '2026-06-30', 'exact'
  )
$sql$, 'repeating the same outdated decision is idempotent');

select is(
  (select count(*)::integer from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.relationship_type = 'participates_in' and history.action = 'marked_outdated'),
  1,
  'repeating an outdated decision does not append duplicate history'
);

select lives_ok($sql$
  select public.archive_relationship((select id from public.relationships where relationship_type = 'participates_in'))
$sql$, 'an outdated relationship can be archived');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'participates_in' $sql$,
  $sql$ values ('confirmed'::text, 'archived'::text) $sql$,
  'archiving does not lower confirmed confidence'
);

select lives_ok($sql$
  select public.restore_relationship((select id from public.relationships where relationship_type = 'participates_in'))
$sql$, 'an archived relationship can be restored');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'participates_in' $sql$,
  $sql$ values ('confirmed'::text, 'outdated'::text) $sql$,
  'restoration returns the last non-archived status without changing confidence'
);

select lives_ok($sql$
  select public.reject_relationship((select id from public.relationships where relationship_type = 'participates_in'), 'No longer correct.')
$sql$, 'the user can reject a previously confirmed historical relationship');

select results_eq(
  $sql$ select confidence, status from public.relationships where relationship_type = 'participates_in' $sql$,
  $sql$ values ('confirmed'::text, 'rejected'::text) $sql$,
  'rejection remains distinct from confidence under the CTO rule'
);

reset role;
set local role service_role;

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    'participates_in', 'explicit',
    array['11000000-0000-4000-8000-000000000001'::uuid],
    'supporting', null, '2026-06-30', 'exact'
  )
$sql$, 'the same evidence cannot recreate a rejected relationship');

select is(
  (select status from public.relationships where relationship_type = 'participates_in'),
  'rejected',
  'the rejected fingerprint remains blocking'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a1000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000004',
    'participates_in', 'explicit',
    array['31000000-0000-4000-8000-000000000003'::uuid],
    'supporting', null, '2026-06-30', 'exact'
  )
$sql$, 'materially new evidence is attached to a rejected relationship');

select is(
  (select status from public.relationships where relationship_type = 'participates_in'),
  'rejected',
  'new evidence does not automatically reactivate a rejected relationship'
);

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
  observed_at,
  created_at
)
select
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  relationships.id,
  'user_declaration',
  '50000000-0000-4000-8000-000000000005',
  '51000000-0000-4000-8000-000000000005',
  'supporting',
  'explicit',
  'normal',
  'capture:50000000-0000-4000-8000-000000000005',
  'New explicit support after rejection.',
  clock_timestamp(),
  clock_timestamp() + interval '1 second'
from public.relationships
where relationship_type = 'participates_in';

select throws_ok($sql$
  delete from public.relationship_evidence
  where relationship_id = (select id from public.relationships where relationship_type = 'participates_in')
$sql$, '42501', 'permission denied for table relationship_evidence', 'normal service paths cannot delete immutable evidence');

select throws_ok($sql$
  delete from public.relationship_history
  where relationship_id = (select id from public.relationships where relationship_type = 'participates_in')
$sql$, '42501', 'permission denied for table relationship_history', 'normal service paths cannot delete immutable history');

select throws_ok($sql$
  delete from public.relationships
  where relationship_type = 'participates_in'
$sql$, '42501', 'permission denied for table relationships', 'normal service paths cannot physically delete relationships');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select is(
  jsonb_array_length(public.get_relationship_review_queue('rejected_with_new_evidence', null, 20) -> 'items'),
  1,
  'strong independent evidence after rejection returns the relationship to review without reactivation'
);

select ok(
  ((public.get_focused_graph('a1000000-0000-4000-8000-000000000001', 1, null, 12, true, false) -> 'edges')::jsonb @> '[{"status":"supported"}]'::jsonb),
  'the focused graph includes supported normal relationships'
);

select ok(
  jsonb_array_length(public.get_focused_graph('a1000000-0000-4000-8000-000000000001', 1, null, 12, true, false) -> 'nodes') <= 9
  and jsonb_array_length(public.get_focused_graph('a1000000-0000-4000-8000-000000000001', 1, null, 12, true, false) -> 'edges') <= 10,
  'the initial mobile graph respects node and edge density limits'
);

select ok(
  not exists (
    select 1
    from jsonb_array_elements(public.get_focused_graph('a1000000-0000-4000-8000-000000000001', 1, null, 12, true, false) -> 'edges') edge
    where edge ->> 'sensitivity' <> 'normal'
       or edge ->> 'status' in ('rejected', 'contradicted', 'outdated', 'archived')
  ),
  'the primary graph excludes sensitive, rejected, contradicted, and historical relations'
);

select ok(
  (public.get_relationship_detail((select id from public.relationships where relationship_type = 'participates_in'), null, null, 20) ?& array['relationship', 'source_entity', 'target_entity', 'evidence_summary', 'evidence', 'history', 'contradictions', 'actions', 'page_info']),
  'relationship detail returns the complete bounded contract'
);

select is(
  cardinality(string_to_array(
    public.get_focused_graph('a1000000-0000-4000-8000-000000000001', 1, null, 1, true, false) #>> '{page_info,next_cursor}',
    '|'
  )),
  5,
  'focused graph cursor encodes all five canonical ordering criteria'
);

select isnt(
  public.get_focused_graph('a1000000-0000-4000-8000-000000000001', 1, null, 1, true, false) #>> '{edges,0,id}',
  public.get_focused_graph(
    'a1000000-0000-4000-8000-000000000001',
    1,
    public.get_focused_graph('a1000000-0000-4000-8000-000000000001', 1, null, 1, true, false) #>> '{page_info,next_cursor}',
    1,
    true,
    false
  ) #>> '{edges,0,id}',
  'focused graph cursor advances without returning the previous edge'
);

select throws_ok($sql$
  select public.get_focused_graph(
    'a1000000-0000-4000-8000-000000000001', 1, null, null, true, false
  )
$sql$, '22023', 'INVALID_INPUT', 'focused graph rejects a null limit instead of running unbounded');

select throws_ok($sql$
  select public.get_relationship_detail(
    (select id from public.relationships where relationship_type = 'participates_in'), null, null, null
  )
$sql$, '22023', 'INVALID_INPUT', 'relationship detail rejects a null limit instead of running unbounded');

select throws_ok($sql$
  select public.get_relationship_review_queue('suggestions', null, null)
$sql$, '22023', 'INVALID_INPUT', 'relationship review rejects a null limit instead of running unbounded');

select * from finish();
rollback;
