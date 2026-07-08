create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  source text not null default 'manual',
  sensitivity text not null default 'normal',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint captures_sensitivity_check check (sensitivity in ('normal', 'sensitive')),
  constraint captures_status_check check (status in ('suggested', 'active', 'confirmed', 'hidden', 'archived', 'deleted'))
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_id uuid references public.captures(id) on delete set null,
  content text not null,
  type text not null default 'other',
  confidence text not null default 'low',
  sensitivity text not null default 'normal',
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint observations_confidence_check check (confidence in ('low', 'medium', 'high', 'confirmed')),
  constraint observations_sensitivity_check check (sensitivity in ('normal', 'sensitive')),
  constraint observations_status_check check (status in ('suggested', 'active', 'confirmed', 'hidden', 'archived', 'deleted'))
);

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  description text,
  confidence text not null default 'low',
  sensitivity text not null default 'normal',
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_confidence_check check (confidence in ('low', 'medium', 'high', 'confirmed')),
  constraint entities_sensitivity_check check (sensitivity in ('normal', 'sensitive')),
  constraint entities_status_check check (status in ('suggested', 'active', 'confirmed', 'hidden', 'archived', 'deleted'))
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete set null,
  observation_id uuid references public.observations(id) on delete set null,
  content text not null,
  type text not null default 'fact',
  confidence text not null default 'low',
  sensitivity text not null default 'normal',
  status text not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memories_confidence_check check (confidence in ('low', 'medium', 'high', 'confirmed')),
  constraint memories_sensitivity_check check (sensitivity in ('normal', 'sensitive')),
  constraint memories_status_check check (status in ('suggested', 'active', 'confirmed', 'hidden', 'archived', 'deleted'))
);

create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint briefings_status_check check (status in ('suggested', 'active', 'confirmed', 'hidden', 'archived', 'deleted'))
);

grant select, insert, update, delete on table public.captures to authenticated;
grant select, insert, update, delete on table public.observations to authenticated;
grant select, insert, update, delete on table public.entities to authenticated;
grant select, insert, update, delete on table public.memories to authenticated;
grant select, insert, update, delete on table public.briefings to authenticated;

grant select, insert, update, delete on table public.captures to service_role;
grant select, insert, update, delete on table public.observations to service_role;
grant select, insert, update, delete on table public.entities to service_role;
grant select, insert, update, delete on table public.memories to service_role;
grant select, insert, update, delete on table public.briefings to service_role;

alter table public.captures enable row level security;
alter table public.observations enable row level security;
alter table public.entities enable row level security;
alter table public.memories enable row level security;
alter table public.briefings enable row level security;

create policy "Users can select own captures"
on public.captures for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own captures"
on public.captures for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own captures"
on public.captures for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own captures"
on public.captures for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own observations"
on public.observations for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own observations"
on public.observations for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own observations"
on public.observations for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own observations"
on public.observations for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own entities"
on public.entities for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own entities"
on public.entities for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own entities"
on public.entities for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own entities"
on public.entities for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own memories"
on public.memories for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own memories"
on public.memories for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own memories"
on public.memories for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own memories"
on public.memories for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can select own briefings"
on public.briefings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own briefings"
on public.briefings for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own briefings"
on public.briefings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own briefings"
on public.briefings for delete
to authenticated
using ((select auth.uid()) = user_id);
