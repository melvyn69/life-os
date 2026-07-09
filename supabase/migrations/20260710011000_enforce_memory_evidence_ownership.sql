drop policy "Users can insert own memory evidence" on public.memory_evidence;

create policy "Users can insert own memory evidence"
on public.memory_evidence for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.observations
    where observations.id = memory_evidence.observation_id
      and observations.user_id = (select auth.uid())
  )
  and (
    (
      entity_id is not null
      and memory_id is null
      and exists (
        select 1
        from public.entities
        where entities.id = memory_evidence.entity_id
          and entities.user_id = (select auth.uid())
      )
    )
    or
    (
      entity_id is null
      and memory_id is not null
      and exists (
        select 1
        from public.memories
        where memories.id = memory_evidence.memory_id
          and memories.user_id = (select auth.uid())
      )
    )
  )
);
