revoke all on table public.relationships from public, anon, authenticated;
revoke all on table public.relationship_evidence from public, anon, authenticated;
revoke all on table public.relationship_history from public, anon, authenticated;

grant select on table public.relationships to authenticated;
grant select on table public.relationship_evidence to authenticated;
grant select on table public.relationship_history to authenticated;

grant select, insert, update on table public.relationships to service_role;
grant select, insert on table public.relationship_evidence to service_role;
grant select, insert on table public.relationship_history to service_role;

alter table public.relationships enable row level security;
alter table public.relationship_evidence enable row level security;
alter table public.relationship_history enable row level security;

create policy "Users can select owned relationships"
on public.relationships
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.entities as source_entity
    where source_entity.id = relationships.source_entity_id
      and source_entity.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.entities as target_entity
    where target_entity.id = relationships.target_entity_id
      and target_entity.user_id = (select auth.uid())
  )
);

create policy "Users can select owned relationship evidence"
on public.relationship_evidence
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.relationships
    where relationships.id = relationship_evidence.relationship_id
      and relationships.user_id = (select auth.uid())
  )
);

create policy "Users can select owned relationship history"
on public.relationship_history
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.relationships
    where relationships.id = relationship_history.relationship_id
      and relationships.user_id = (select auth.uid())
  )
);
