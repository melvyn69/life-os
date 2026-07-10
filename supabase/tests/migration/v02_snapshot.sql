insert into auth.users (id, aud, role, email)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'migration-snapshot@example.test');

insert into public.captures (id, user_id, content, status, sensitivity, source)
values (
  '10000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Existing v0.2 capture.',
  'archived',
  'normal',
  'text'
);

insert into public.observations (
  id, user_id, capture_id, content, type, confidence, sensitivity, status
)
values (
  '20000000-0000-4000-8000-000000000002',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '10000000-0000-4000-8000-000000000001',
  'Existing v0.2 observation.',
  'fact',
  'high',
  'normal',
  'active'
);

insert into public.entities (
  id, user_id, name, type, description, confidence, sensitivity, status
)
values (
  '30000000-0000-4000-8000-000000000003',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Existing entity',
  'project',
  'Created before Life Graph.',
  'high',
  'normal',
  'active'
);

insert into public.memories (
  id, user_id, observation_id, entity_id, content, type, confidence, sensitivity, status
)
values (
  '40000000-0000-4000-8000-000000000004',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '20000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003',
  'Existing v0.2 memory.',
  'fact',
  'high',
  'normal',
  'active'
);
