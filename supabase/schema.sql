-- ============================================================
-- Farkle Game — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
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
    "totalFarkles": 0
  }'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "own_profile_select"
  on profiles for select
  using (auth.uid() = id);

create policy "own_profile_insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "own_profile_update"
  on profiles for update
  using (auth.uid() = id);

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

create policy "own_history_select"
  on match_history for select
  using (auth.uid() = user_id);

create policy "own_history_insert"
  on match_history for insert
  with check (auth.uid() = user_id);

create policy "own_history_delete"
  on match_history for delete
  using (auth.uid() = user_id);
