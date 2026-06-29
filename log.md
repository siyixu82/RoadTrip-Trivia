# Build Log — RoadTrip Trivia

A running record of build progress. Newest entries at the top.

Phased plan: Phase 0 scaffold → Phase 1 schema + 3 sample quizzes → Phase 2 play loop → Phase 3 bulk content → Phase 4 catalog/library → Phase 5 auth/offline → Phase 6 polish/ship.

---

## 2026-06-28

### Recovery note (process)
- A `git reset --hard` was run while scaffold files were staged but **not yet committed**
  (the commit+push command had been blocked as one unit). The reset deleted the staged
  files. All were recreated from the scratchpad scaffold + regenerated; `node_modules`
  survived (gitignored), so no reinstall was needed. **Lesson:** never `reset --hard`
  with un-committed work staged; commit to a branch first.

### Schema finalized before build
- Dropped `history.answers` (no per-question answer storage — confirmed not needed).
- Removed `quizzes.park_name`, `quizzes.state` (MVP-specific) and `quizzes.source` (all quizzes are AI-generated).
- Unified naming: `history.total` → `history.question_count` to match `quizzes.question_count`.
- Synced these changes into CLAUDE.md.

### Phase 0 — Scaffold ✅
- Node v24.15.0, npm 11.12.1.
- Scaffolded **Next.js 16.2.9** (App Router, TypeScript, Tailwind v4, ESLint, `src/`, `@/*` alias, Turbopack) via `create-next-app`. React 19.2.4.
  - Note: scaffolded in a temp lowercase dir and copied in, because npm rejects the capitalized `RoadTrip-Trivia` dir name as a package name. `package.json` name is `roadtrip-trivia`.
- Installed `@supabase/supabase-js`.
- **Supabase client** at [src/lib/supabase/client.ts](src/lib/supabase/client.ts) — singleton browser client; throws a clear error if env vars are missing.
- **Typed schema** at [src/lib/supabase/types.ts](src/lib/supabase/types.ts) — hand-authored `Database` type mirroring the four tables (replaceable later via `supabase gen types`).
- **Hello World** home page ([src/app/page.tsx](src/app/page.tsx)) with a live Supabase connectivity indicator ([src/components/SupabaseStatus.tsx](src/components/SupabaseStatus.tsx)).
- Env: `.env.example` (committed template) + `.env.local` (git-ignored, real Supabase URL + anon key added). `.gitignore` keeps `.env.example` tracked.
- **Supabase connection verified:** anon key authenticates (REST returns PGRST205 "table not found" — expected pre-migration; auth health endpoint 200). URL corrected to base (dropped stray `/rest/v1/`).
- Verified: `tsc --noEmit` clean, `next build` succeeds, dev server returns HTTP 200.

### Phase 0 — Vercel ✅
- Scaffold pushed via branch `scaffold-phase-0` → **PR #3** → merged to `main` (commit 3d83307).
  (Required granting `chongbin-zheng` write access to `siyixu82/RoadTrip-Trivia`.)
- Project imported at **https://roadtrip-trivia.vercel.app** (Vercel team `xusiyi82-1385`).
- **Two deploy bugs found & fixed (via Vercel API/CLI):**
  1. Project **framework preset was `None`** → Vercel ran a 0ms no-op build (no `next build`),
     so the domain returned `404 NOT_FOUND`. Fixed by setting framework → `nextjs`.
  2. Anon-key env var was **misspelled** `NEXT_PUBLIC_SUPBASE_ANON_KEY` (missing the "A").
     Replaced with correctly-named `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production/preview/development).
- Redeployed: production now serves **HTTP 200**, "Hello World", Supabase URL inlined in the
  client bundle (connectivity badge green). Vercel reads `NEXT_PUBLIC_SUPABASE_*` from project
  env; local uses `.env.local`.
- Note: `next dev`/`next build` deprecation — none; build clean.

### Phase 1 — Schema migration + 3 sample quizzes ✅ (via Supabase CLI)
- `supabase init` → `supabase/config.toml` + `supabase/migrations/`.
- **Schema migration** `20260629050327_init_schema.sql`: `profiles`, `quizzes`, `saves`,
  `history` + indexes + RLS policies (users own their rows; `quizzes` publicly readable,
  writes denied to anon/authenticated).
- **Seed migration** `20260629050443_seed_sample_quizzes.sql`: Grand Canyon / Yellowstone /
  Yosemite, 20 Q each (60 total), idempotent via `on conflict (slug)`. JSON validated
  locally (4 options each, correct_index 0–3, no dup ids).
- Applied to remote via `supabase db push` (user ran login/link/push; DB password stays
  with user).
- **Verified live (anon key):** 3 quizzes readable (count 0-2/3), Grand Canyon Q1 → Arizona;
  RLS confirmed — `profiles`/`saves`/`history` anon reads return `[]`, anon quiz insert
  denied (42501). Connectivity badge now reads "connected · quizzes table found".

### Phase 2 — Core play loop ✅ (PR #5)
- **Repository layer** `src/lib/repository/quizRepository.ts` (`listQuizzes`,
  `getQuizBySlug`) — UI talks only to this; IndexedDB/offline slots in here later.
- **Home** `/` lists catalog quizzes with Play (minimal; real Home/Explore is Phase 4).
- **Quiz player** `/quiz/[slug]` — 20 Q, A–D options, correct→green / wrong→red,
  ~1.1s auto-advance, progress bar, score screen with Retry/Home.
- **History persistence deferred to Phase 5** (auth): RLS needs an authenticated
  `user_id`. Score shows but isn't saved yet. Marked with a NOTE at the finish handler.
- Removed Phase 0 `SupabaseStatus` (catalog list now proves connectivity).
- Verified: `tsc` clean, `next build` passes, routes 200 locally; Vitest tests pass.

### Phase 3 — Catalog content pipeline + curated batch ✅ (PR #6)
- Chosen approach: **curated batch + pipeline** (per-park JSON + service-role loader).
- `content/quizzes/*.json` — **12 parks, 240 questions** (Grand Canyon, Yellowstone,
  Yosemite, Zion, Great Smoky Mountains, Rocky Mountain, Acadia, Glacier, Arches,
  Bryce Canyon, Olympic, Everglades). Files are the source of truth.
- `scripts/load-quizzes.mjs` — validates (20 Q, 4 options, correct_index 0–3, unique
  ids/slugs) and **upserts by slug** using `SUPABASE_SERVICE_ROLE_KEY` (sb_secret_…).
- `scripts/shuffle-options.mjs` — deterministic, idempotent answer-position spread.
  Final distribution {0:67, 1:61, 2:60, 3:52}.
- Loaded to remote; **verified 12 quizzes readable via anon** (count 0-11/12);
  shuffled answers intact (Zion Q1 → Utah).
- Note: service-role key lives only in `.env.local` (git-ignored), never in Vercel.

### Next: Phase 4 — Home / Explore / Saved tabs
- Real three-tab nav; Explore search/filter; Saved (saves + history) — history view
  arrives with auth (Phase 5).
