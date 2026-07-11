begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, aud, role, email)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'rls-b@example.test');

insert into public.captures (id, user_id, content, status, sensitivity, source)
values
  ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'User A evidence.', 'archived', 'normal', 'text'),
  ('b0000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'User B evidence.', 'archived', 'normal', 'text');

insert into public.observations (id, user_id, capture_id, content, type, confidence, sensitivity, status)
values
  ('a1000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a0000000-0000-4000-8000-000000000001', 'User A relationship.', 'relationship', 'medium', 'normal', 'suggested'),
  ('b1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b0000000-0000-4000-8000-000000000001', 'User B relationship.', 'relationship', 'medium', 'normal', 'suggested');

insert into public.entities (id, user_id, name, type, confidence, sensitivity, status)
values
  ('aa000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A source', 'person', 'high', 'normal', 'active'),
  ('aa000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A target', 'project', 'high', 'normal', 'active'),
  ('bb000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B source', 'person', 'high', 'normal', 'active'),
  ('bb000000-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B target', 'project', 'high', 'normal', 'active');

set local role service_role;

select ok(
  not has_table_privilege('service_role', 'public.relationships', 'DELETE'),
  'service role cannot physically delete relationships'
);

select ok(
  not has_table_privilege('service_role', 'public.relationship_evidence', 'DELETE')
  and not has_table_privilege('service_role', 'public.relationship_evidence', 'UPDATE'),
  'service role cannot mutate or delete append-only relationship evidence'
);

select ok(
  not has_table_privilege('service_role', 'public.relationship_history', 'DELETE')
  and not has_table_privilege('service_role', 'public.relationship_history', 'UPDATE'),
  'service role cannot mutate or delete append-only relationship history'
);

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aa000000-0000-4000-8000-000000000001',
    'aa000000-0000-4000-8000-000000000002',
    'contributes_to', 'explicit',
    array['a1000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'service role creates User A relationship with an explicit user filter');

select lives_ok($sql$
  select public.ingest_relationship_candidate(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bb000000-0000-4000-8000-000000000001',
    'bb000000-0000-4000-8000-000000000002',
    'contributes_to', 'explicit',
    array['b1000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, 'service role creates User B relationship with an explicit user filter');

select set_config(
  'test.relationship_a',
  (select id::text from public.relationships where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  true
);
select set_config(
  'test.relationship_b',
  (select id::text from public.relationships where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  true
);

select throws_ok($sql$
  select public.ingest_relationship_candidate(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aa000000-0000-4000-8000-000000000001',
    'bb000000-0000-4000-8000-000000000001',
    'concerns', 'implicit',
    array['a1000000-0000-4000-8000-000000000001'::uuid]
  )
$sql$, '42501', 'ENTITY_OWNERSHIP_MISMATCH', 'service-role ingestion still rejects cross-user entities');

select is(
  (select count(*)::integer from public.relationships where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  1,
  'service-role reads remain explicitly filterable by User A'
);

select is(
  (select count(*)::integer from public.relationships where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and source_entity_id in ('aa000000-0000-4000-8000-000000000001', 'aa000000-0000-4000-8000-000000000002')),
  0,
  'a service-role query filtered to User B does not return User A rows'
);

select throws_ok($sql$
  update public.relationships
  set status = 'confirmed', confidence = 'confirmed'
  where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
$sql$, '42501', 'FORBIDDEN', 'service role cannot bypass the confirmed transition trigger');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select is(
  (select count(*)::integer from public.relationships),
  1,
  'User A reads only User A relationships'
);

select is(
  (select count(*)::integer from public.relationships where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  0,
  'User A cannot read User B relationships'
);

select is(
  (select count(*)::integer from public.relationship_evidence evidence join public.relationships relationship on relationship.id = evidence.relationship_id where relationship.user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  0,
  'User A cannot read User B evidence'
);

select is(
  (select count(*)::integer from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  0,
  'User A cannot read User B history'
);

select throws_ok($sql$
  insert into public.relationships (
    user_id, source_entity_id, target_entity_id, relationship_type,
    status, confidence, sensitivity, is_directional,
    candidate_fingerprint, created_by
  ) values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aa000000-0000-4000-8000-000000000001',
    'aa000000-0000-4000-8000-000000000002',
    'concerns', 'suggested', 'low', 'normal', true,
    repeat('0', 64), 'user'
  )
$sql$, '42501', 'permission denied for table relationships', 'authenticated users cannot insert relationship rows directly');

select throws_ok($sql$
  update public.relationships set is_visible = false
$sql$, '42501', 'permission denied for table relationships', 'authenticated users cannot update relationship rows directly');

select throws_ok($sql$
  delete from public.relationships
$sql$, '42501', 'permission denied for table relationships', 'authenticated users cannot delete relationship rows directly');

select throws_ok(
  format(
    'select public.confirm_relationship(%L::uuid)',
    current_setting('test.relationship_b')
  ),
  'P0002', 'NOT_FOUND',
  'User A receives NOT_FOUND for User B RPC targets'
);

select throws_ok(
  'select public.confirm_relationship(''99999999-9999-4999-8999-999999999999''::uuid)',
  'P0002', 'NOT_FOUND',
  'User A receives the same NOT_FOUND response for an unknown target'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

select is(
  (select count(*)::integer from public.relationships),
  1,
  'User B reads only User B relationships'
);

select is(
  (select count(*)::integer from public.relationships where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0,
  'User B cannot read User A relationships'
);

select is(
  (select count(*)::integer from public.relationship_evidence evidence join public.relationships relationship on relationship.id = evidence.relationship_id where relationship.user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0,
  'User B cannot read User A evidence'
);

select is(
  (select count(*)::integer from public.relationship_history history join public.relationships relationship on relationship.id = history.relationship_id where relationship.user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0,
  'User B cannot read User A history'
);

select throws_ok(
  format(
    'select public.confirm_relationship(%L::uuid)',
    current_setting('test.relationship_a')
  ),
  'P0002', 'NOT_FOUND',
  'User B receives NOT_FOUND for User A RPC targets'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);

select throws_ok(
  'select public.get_focused_graph(''aa000000-0000-4000-8000-000000000001''::uuid)',
  '42501', 'AUTH_REQUIRED',
  'an authenticated role without a user identity is rejected'
);

reset role;
set local role anon;

select throws_ok(
  'select count(*) from public.relationships',
  '42501', 'permission denied for table relationships',
  'anonymous users cannot read relationships'
);

select throws_ok(
  'select public.confirm_relationship(''99999999-9999-4999-8999-999999999999''::uuid)',
  '42501', 'permission denied for function confirm_relationship',
  'anonymous users cannot execute relationship mutation RPCs'
);

select * from finish();
rollback;
