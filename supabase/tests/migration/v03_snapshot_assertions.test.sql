begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select is(
  (select content from public.captures where id = '10000000-0000-4000-8000-000000000001'),
  'Existing v0.2 capture.',
  'the v0.2 capture survives the Life Graph migrations'
);

select is(
  (select content from public.observations where id = '20000000-0000-4000-8000-000000000002'),
  'Existing v0.2 observation.',
  'the v0.2 observation survives the Life Graph migrations'
);

select results_eq(
  $sql$
    select name, confidence, status
    from public.entities
    where id = '30000000-0000-4000-8000-000000000003'
  $sql$,
  $sql$ values ('Existing entity'::text, 'high'::text, 'active'::text) $sql$,
  'the v0.2 entity remains unchanged'
);

select results_eq(
  $sql$
    select content, confidence, status
    from public.memories
    where id = '40000000-0000-4000-8000-000000000004'
  $sql$,
  $sql$ values ('Existing v0.2 memory.'::text, 'high'::text, 'active'::text) $sql$,
  'the v0.2 memory remains unchanged'
);

select has_table('public', 'relationships', 'the relationships table is added after the v0.2 snapshot');
select has_table('public', 'relationship_evidence', 'the relationship evidence table is added after the v0.2 snapshot');
select has_table('public', 'relationship_history', 'the relationship history table is added after the v0.2 snapshot');

select is(
  (select count(*)::integer from public.relationships),
  0,
  'migration does not invent relationships for existing v0.2 data'
);

revoke execute on function public.get_focused_graph(uuid, integer, text, integer, boolean, boolean)
from authenticated;
revoke execute on function public.get_relationship_detail(uuid, text, text, integer)
from authenticated;
revoke execute on function public.get_relationship_review_queue(text, text, integer)
from authenticated;

select ok(
  not has_function_privilege(
    'authenticated',
    'public.get_focused_graph(uuid,integer,text,integer,boolean,boolean)',
    'EXECUTE'
  ),
  'a non-destructive rollback can disable the graph query surface'
);

select is(
  (select count(*)::integer from public.memories where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  1,
  'disabling Life Graph usage leaves Living Memory data available'
);

select has_table('public', 'relationship_history', 'rollback does not drop relationship history storage');

select * from finish();
rollback;
