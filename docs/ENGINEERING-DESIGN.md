# RoadTrip Trivia — Engineering Design (MVP)

> **Status: Draft — open for review.** Comment inline on any line.
>
> Scope: the engineering design for the **MVP** defined in [`PRD-MVP.md`](PRD-MVP.md)
> — a mobile-first **web app on Vercel** with **offline play**. This design uses a
> **Supabase (Postgres) backend with user accounts** so the app is extensible toward
> the V1 features (AI generation, marketplace, gamification, cross-device sync).

---

## 1. Context & Constraints

From the MVP PRD plus the decision to build on a real backend:

- **Platform:** mobile-first responsive web app on **Vercel**, installable as a **PWA**.
- **Backend:** **Supabase** — Postgres (data) + Auth (accounts/`user_id`) + Storage +
  Edge Functions (for V1 AI). Supabase is the **source of truth**.
- **Accounts from day one:** every user has a `user_id` (via Supabase Auth, starting
  anonymous — see §6), so all user data is owned and portable across devices.
- **Content:** a catalog of pre-generated quizzes — one per U.S. National Park (~63),
  each **20 multiple-choice questions** — stored in Postgres (a `quizzes` table).
- **Offline:** **IndexedDB** caches only the quizzes the user **saved** or **completed**
  (plus their history), so those work with no connection. The full catalog is browsed
  online.

### Sizing note
A quiz is ~20 questions × (prompt + 4 options) ≈ **1–3 KB** of JSON; the whole catalog
is ~**100–300 KB**. We still use a database — not because the content is large, but for
**accounts, cross-device sync, and extensibility**. The small size simply means caching
each user's saved/completed subset offline is cheap.

---

## 2. Architecture Overview

```
            ┌─────────────────────────────┐
            │   Next.js PWA on Vercel      │
            │   (React UI + service worker)│
            └──────────────┬──────────────┘
            supabase-js     │  HTTPS
                            ▼
   ┌──────────────────────────────────────────────┐
   │                 Supabase                       │
   │  Auth → user_id    Postgres (source of truth): │
   │                    profiles, quizzes, saves,   │
   │                    history   (+ RLS)           │
   │  Storage (images)  Edge Functions (V1: AI)     │
   └──────────────────────────────────────────────┘
                            ▲
        sync: pull catalog on demand;  │  push local writes (outbox)
        cache saved/completed quizzes  ▼
   ┌──────────────────────────────────────────────┐
   │  IndexedDB (offline cache, per device)         │
   │  quizzes(saved+completed content), saves,      │
   │  history, outbox, meta                         │
   └──────────────────────────────────────────────┘
```

**Source of truth = Supabase.** The client reads/writes Supabase when online. IndexedDB
is a **local mirror of the user's own saved + completed quizzes** (and a write buffer
for offline), *not* a copy of the whole catalog.

---

## 3. Recommended Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** on Vercel | First-class Vercel target; SSR/edge; easy PWA. |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions) | Relational data, accounts, RLS, and a server for V1 AI — one managed platform. |
| Client SDK | **`@supabase/supabase-js`** | Auth, queries, realtime in one client. |
| PWA / offline | **Serwist** (`@serwist/next`, Workbox-based) | Precaches app shell; offline navigation. |
| Local cache | **IndexedDB** via **`idb`** | Async, structured offline store for saved/completed quizzes + outbox. |
| State | React + **zustand**, behind a data/repository layer | UI talks to one repo that hides "Supabase vs IndexedDB". |

---

## 4. Backend Data Model (Supabase / Postgres)

Four tables. `profiles` is the **user table**; `quizzes` is the **quiz table**; `saves`
and `history` capture each user's relationship to quizzes.

```sql
-- USER TABLE (Supabase Auth owns auth.users; we mirror public/app fields here)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  preferences   jsonb default '{}',          -- extensible: settings, voice, difficulty (V1)
  created_at    timestamptz default now()
  -- V1 gamification can add: xp int, level int, streak int (or a user_stats table)
);

-- QUIZ TABLE (catalog content; one row per park quiz)
create table quizzes (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique,                -- 'grand-canyon'
  title          text not null,              -- 'Grand Canyon Trivia'
  park_name      text,
  state          text,
  question_count int  default 20,
  difficulty     text,
  questions      jsonb not null,             -- [{id, prompt, options[4], correct_index}]
  source         text default 'curated',     -- 'curated' | 'ai' | 'user' (V1)
  created_by     uuid references profiles(id),-- null for official catalog (V1 authoring)
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- SAVES (a user bookmarked a quiz; is_offline = the PRD "Download" pin)
create table saves (
  user_id    uuid references profiles(id) on delete cascade,
  quiz_id    uuid references quizzes(id) on delete cascade,
  is_offline boolean default true,           -- keep this quiz cached in IndexedDB
  saved_at   timestamptz default now(),
  primary key (user_id, quiz_id)
);

-- HISTORY (was "attempts"): append-only, one row per completion
create table history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  quiz_id      uuid references quizzes(id) on delete cascade,
  score        int  not null,
  total        int  not null default 20,
  answers      jsonb,                         -- optional per-question answers for review
  completed_at timestamptz default now()
);

create index history_user_time on history (user_id, completed_at desc);
create index history_user_quiz on history (user_id, quiz_id);
create index saves_user_time   on saves   (user_id, saved_at desc);
```

**Row-Level Security (RLS):** enabled on all tables.
- `profiles`, `saves`, `history`: a user can read/write only rows where
  `user_id = auth.uid()`.
- `quizzes`: official catalog (`source='curated'`) is readable by everyone; user/AI
  quizzes (V1) are restricted to their `created_by` owner (or a `is_public` flag).

> "User information about a quiz" (saved? best score? last played?) is derived from
> `saves` + `history`. If we want it as one row per user×quiz, expose a **`user_quiz`
> view** (latest score, best score, times played, is_saved) rather than a new table.

---

## 5. Local Cache (IndexedDB)

IndexedDB holds **only what the user saved or completed** — never the whole catalog.

```
db: roadtrip-trivia (v1)
  quizzes   { quizId (key), ...content }     // content for saved OR completed quizzes
  saves     { quizId (key), is_offline, saved_at }
  history   { id (key), quizId, score, total, completed_at, answers? }
  outbox    { id (key), op, table, payload, queuedAt }  // writes made offline, to sync
  meta      { key, value }                   // user_id, sync cursors, lastSyncedAt
```
Indexes mirror the server: `history.by_completed_at`, `history.by_quizId`,
`saves.by_saved_at`. Keeping the stores separate (vs. one user blob) means recording a
completion is a single append, the History view is an index query, and each store maps
1:1 onto its Postgres table for sync.

**What is cached, and when**
- **Save a quiz** → write `saves` (server + local) and **fetch + cache that quiz's
  content** into IndexedDB `quizzes`. Now it's playable offline.
- **Complete a quiz** → write `history` (server + local); the quiz content is already
  cached (you just played it), so review/replay works offline.
- **Browsing Home/Explore** uses the live catalog from Supabase (online); we do **not**
  mirror the full catalog locally.

---

## 6. Auth & `user_id`

- **Supabase Auth** issues the `user_id` used everywhere (`auth.uid()` in RLS).
- **Frictionless start:** use **anonymous sign-in** so a brand-new visitor immediately
  has a `user_id` and a `profiles` row — they can play, save, and build history with no
  signup. Later they **upgrade to a real account** (email/OAuth) and keep all their data
  (the anonymous user is converted, not replaced).
- This satisfies the PRD's "no forced accounts" feel while giving us accounts and
  cross-device portability the moment a user signs in.

**IndexedDB is not user-aware** — it is a single per-origin store shared by every
visitor on that browser. We scope it ourselves:
- **`meta.user_id`** records whose data is currently cached.
- **On sign-in:** fetch that user's `saves`, `history`, and quiz content from Supabase
  and populate IndexedDB.
- **On sign-out (or user switch):** **clear** the `quizzes`, `saves`, `history`, and
  `outbox` stores before the next user can access the device — otherwise user B would
  see user A's cached data. A simple "wipe on sign-out" guard covers this; it's
  straightforward but must not be omitted.

---

## 7. Offline & Sync

With Supabase as source of truth, offline support is a **cache + write-buffer (outbox)**
pattern:

1. **App shell** is precached by the service worker (Serwist) → the app boots offline.
2. **Reads offline:** saved/completed quizzes, their content, and history come from
   IndexedDB. (Full-catalog browse needs the network — expected, since discovery is an
   online activity.)
3. **Writes offline:** completing a saved quiz, saving/unsaving — write to IndexedDB and
   **enqueue the mutation in `outbox`**. The UI updates immediately (optimistic).
4. **On reconnect:** flush the `outbox` to Supabase in order, then **pull** remote
   changes since the last cursor (covers other devices) and reconcile.

**Conflict policy**
- `history` is **append-only** → union by row `id`; no conflicts.
- `saves` → **last-write-wins** using `saved_at`, with tombstones for unsave.

**Durability** now lives on the **server**: even if a browser evicts IndexedDB (Safari's
7-day script-storage cap, low-disk eviction, cleared site data), the user's history and
saves are safe in Supabase and re-sync on next sign-in. IndexedDB eviction degrades only
*offline availability*, not data integrity. We still call `navigator.storage.persist()`
and encourage PWA install to maximize offline retention on iOS.

---

## 8. Key Flows

1. **Browse & play (online):** Home/Explore reads `quizzes` from Supabase → play → write
   `history` (server + local).
2. **Save:** insert `saves` (server + local) + cache quiz content in IndexedDB → offline-ready.
3. **Play offline:** open a saved/completed quiz from IndexedDB → finish → write `history`
   locally + enqueue in `outbox`.
4. **Sync:** on reconnect, flush `outbox` → pull remote deltas → update cache.
5. **History view:** Saved → History reads from IndexedDB (and refreshes from Supabase
   when online).

---

## 9. Extensibility (toward V1)

The schema is built to grow without rewrites:
- **AI generation:** an Edge Function calls the LLM and inserts a `quizzes` row with
  `source='ai'`, `created_by=user`. Same shape as catalog quizzes → no client changes.
- **User-authored / marketplace:** `created_by` + an `is_public` flag + a `quiz_tags`
  table enable the Explore marketplace (categories, featured, badges).
- **Gamification:** add `xp`/`level`/`streak` to `profiles` or a `user_stats` table;
  results screen reads from there.
- **Settings/accessibility:** the `profiles.preferences` jsonb already holds voice,
  speed, difficulty, notification toggles.
- **Realtime / social:** Supabase Realtime can power leaderboards or shared sessions.

---

## 10. Risks & Open Questions

- **Auth complexity vs MVP speed:** a backend + RLS is more upfront work than pure
  client-side. Anonymous sign-in keeps user friction near zero; the cost is operational
  (managing Supabase, policies). Acceptable given the extensibility goal.
- **Answer exposure:** `questions.correct_index` ships to the client for offline play —
  fine for low-stakes trivia. If V1 leaderboards make cheating matter, grade in an Edge
  Function and withhold answers until submission.
- **iOS Safari storage eviction:** mitigated by server-side durability (§7) + PWA install.
- **Offline-first catalog:** we deliberately *don't* cache the whole catalog offline;
  confirm that's acceptable (discovery requires connectivity; your saved set does not).
- **History granularity:** kept **append-only** (every attempt). "Best/latest score" is a
  query or the `user_quiz` view — no schema change needed.
