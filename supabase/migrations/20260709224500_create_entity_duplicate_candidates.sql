create table public.entity_duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  duplicate_entity_id uuid not null references public.entities(id) on delete cascade,
  reason text not null,
  confidence text not null default 'medium',
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_duplicate_candidates_distinct_check check (entity_id <> duplicate_entity_id),
  constraint entity_duplicate_candidates_confidence_check check (confidence in ('low', 'medium', 'high', 'confirmed')),
  constraint entity_duplicate_candidates_status_check check (status in ('suggested', 'active', 'confirmed', 'hidden', 'archived', 'deleted')),
  constraint entity_duplicate_candidates_unique_pair unique (user_id, entity_id, duplicate_entity_id)
);

grant select, insert, update, delete on table public.entity_duplicate_candidates to authenticated;
grant select, insert, update, delete on table public.entity_duplicate_candidates to service_role;

alter table public.entity_duplicate_candidates enable row level security;

create policy "Users can select own entity duplicate candidates"
on public.entity_duplicate_candidates for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own entity duplicate candidates"
on public.entity_duplicate_candidates for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own entity duplicate candidates"
on public.entity_duplicate_candidates for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own entity duplicate candidates"
on public.entity_duplicate_candidates for delete
to authenticated
using ((select auth.uid()) = user_id);
