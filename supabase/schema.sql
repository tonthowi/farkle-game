-- ============================================================
-- Farkle Game — Supabase Schema
-- Safe to run multiple times (fully idempotent).
-- Project: Settings → SQL Editor → New query → paste → Run
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
-- Extends auth.users (one row per registered user)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null,
  avatar     text not null default '🎲',
  stats      jsonb not null default '{
    "gamesPlayed": 0,
    "wins": 0,
    "losses": 0,
    "bestScore": 0,
    "totalPointsScored": 0,
    "totalFarkles": 0,
    "tokens": 500
  }'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Drop and recreate policies so re-runs don't error
-- Any authenticated user can read any profile (username, avatar, stats
-- are non-sensitive and needed for multiplayer opponent display).
drop policy if exists "own_profile_select" on profiles;
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select"
  on profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "own_profile_insert" on profiles;
create policy "own_profile_insert"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "own_profile_update" on profiles;
create policy "own_profile_update"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "own_profile_delete" on profiles;
create policy "own_profile_delete"
  on profiles for delete
  using (auth.uid() = id);

-- Auto-create a profile row whenever a user signs up in auth.users.
-- Runs as SECURITY DEFINER (bypasses RLS) so it works even when email
-- confirmation is enabled and no session exists yet.
create or replace function public.create_profile_on_signup()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar, stats)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1),
      'Traveller'
    ),
    coalesce(new.raw_user_meta_data->>'avatar', '🎲'),
    '{"gamesPlayed":0,"wins":0,"losses":0,"bestScore":0,"totalPointsScored":0,"totalFarkles":0,"tokens":500}'::jsonb
  )
  on conflict (id) do nothing; -- app-side insert (with real username) takes precedence
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_on_signup();

-- Backfill — create profile rows for any existing users who don't have one
-- (covers accounts created before this trigger was added)
insert into public.profiles (id, username, avatar, stats)
select
  u.id,
  coalesce(split_part(u.email, '@', 1), 'Traveller'),
  '🎲',
  '{"gamesPlayed":0,"wins":0,"losses":0,"bestScore":0,"totalPointsScored":0,"totalFarkles":0,"tokens":500}'::jsonb
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ── Match History ────────────────────────────────────────────
-- One row per completed game, per user
create table if not exists match_history (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             timestamptz not null,
  mode             text not null,           -- 'vs-computer' | 'local-multiplayer'
  players          jsonb not null,          -- MatchPlayer[]
  winner_name      text not null,
  duration_seconds integer not null,
  target_score     integer not null,
  created_at       timestamptz not null default now()
);

alter table match_history enable row level security;

drop policy if exists "own_history_select" on match_history;
create policy "own_history_select"
  on match_history for select
  using (auth.uid() = user_id);

drop policy if exists "own_history_insert" on match_history;
create policy "own_history_insert"
  on match_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "own_history_delete" on match_history;
create policy "own_history_delete"
  on match_history for delete
  using (auth.uid() = user_id);

-- ── Rooms ─────────────────────────────────────────────────────
-- One row per active online multiplayer room
create table if not exists rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,           -- 6-char join code e.g. "FKL123"
  host_id      uuid not null references auth.users(id) on delete cascade,
  guest_id     uuid references auth.users(id) on delete set null,
  status       text not null default 'waiting', -- 'waiting'|'ready'|'playing'|'finished'
  target_score integer not null default 10000,
  game_state   jsonb,                           -- full GameState snapshot
  created_at   timestamptz not null default now()
);

alter table rooms enable row level security;

-- Anyone authenticated can look up a room by code (needed to join)
drop policy if exists "rooms_select" on rooms;
create policy "rooms_select" on rooms for select
  using (auth.role() = 'authenticated');

-- Only the host can insert their own room
drop policy if exists "rooms_insert" on rooms;
create policy "rooms_insert" on rooms for insert
  with check (auth.uid() = host_id);

-- Host or guest can update; unauthenticated guests can join empty rooms
drop policy if exists "rooms_update" on rooms;
create policy "rooms_update" on rooms for update
  using (
    auth.uid() = host_id
    or auth.uid() = guest_id
    or (guest_id is null and status = 'waiting')
  );

-- Host can delete (cancel/leave)
drop policy if exists "rooms_delete" on rooms;
create policy "rooms_delete" on rooms for delete
  using (auth.uid() = host_id);

-- ── Realtime ─────────────────────────────────────────────────
-- Enable postgres_changes events for the rooms table so hosts
-- and guests receive live updates (guest joined, game started).
alter publication supabase_realtime add table rooms;
