-- RoadTrip Trivia — initial schema
-- Mirrors docs/ENGINEERING-DESIGN.md §4. Four tables + RLS.

-- ---------------------------------------------------------------------------
-- PROFILES — app-level user table (mirrors auth.users; one row per user)
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  preferences   jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- QUIZZES — catalog content (one row per quiz)
-- questions: [{ id, prompt, options[4], correct_index }]
-- ---------------------------------------------------------------------------
create table quizzes (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique,
  title          text not null,
  question_count int not null default 20,
  difficulty     text,
  questions      jsonb not null,
  created_by     uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SAVES — a user bookmarked a quiz (is_offline = the PRD "Download" pin)
-- ---------------------------------------------------------------------------
create table saves (
  user_id    uuid not null references profiles(id) on delete cascade,
  quiz_id    uuid not null references quizzes(id) on delete cascade,
  is_offline boolean not null default true,
  saved_at   timestamptz not null default now(),
  primary key (user_id, quiz_id)
);

-- ---------------------------------------------------------------------------
-- HISTORY — append-only, one row per quiz completion
-- ---------------------------------------------------------------------------
create table history (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  score          int not null,
  question_count int not null default 20,
  completed_at   timestamptz not null default now()
);

create index history_user_time on history (user_id, completed_at desc);
create index history_user_quiz on history (user_id, quiz_id);
create index saves_user_time   on saves   (user_id, saved_at desc);

-- ---------------------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table quizzes  enable row level security;
alter table saves    enable row level security;
alter table history  enable row level security;

-- profiles: a user reads/writes only their own row
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- quizzes: catalog is readable by everyone (incl. the anon role).
-- Writes are intentionally not granted to anon/authenticated here; the catalog
-- is seeded server-side (service role). V1 user-authoring will add a
-- created_by-scoped insert policy.
create policy "quizzes_select_all" on quizzes
  for select using (true);

-- saves: a user manages only their own bookmarks
create policy "saves_all_own" on saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- history: a user reads and appends only their own attempts (append-only:
-- no update/delete policies)
create policy "history_select_own" on history
  for select using (auth.uid() = user_id);
create policy "history_insert_own" on history
  for insert with check (auth.uid() = user_id);
