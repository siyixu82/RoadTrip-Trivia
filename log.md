# Build Log — RoadTrip Trivia

A running record of build progress. Newest entries at the top.

Phased plan: Phase 0 scaffold → Phase 1 schema + 3 sample quizzes → Phase 2 play loop → Phase 3 bulk content → Phase 4 catalog/library → Phase 5 auth/offline → Phase 6 polish/ship.

---

## 2026-06-29

### Phase 4 — Home / Explore / Saved tabs ✅
- **Three-tab shell:** `BottomNav` (Home/Explore/Saved, active-state highlight) +
  `AppChrome` (wraps `layout.tsx`; hides nav on `/quiz/*`, pads content for the
  fixed nav). Quiz player still takes the full screen while playing.
- **Design language applied:** `globals.css` now sets cream `#FFF8EC` background +
  charcoal `#1a1a1a` foreground and drops the default dark-mode override for one
  consistent sketch aesthetic (rounded cards, dashed dividers, amber CTAs).
- **Home** (`/`) — recommended slice (first 6) of the catalog + "Explore all N
  parks →" link. **Explore** (`/explore`) — full catalog with name search
  (search by title; the schema has no `state` column). Both render the shared
  `QuizCard` (name · 20 Q · Save ♡ · Play). Catalog load extracted to
  `useCatalog` hook over `quizRepository`.
- **Saved** (`/saved`) — Saved ↔ History toggle. Saved: Play / Download
  (offline pin) / Remove. History: date · score X/20 · Retry.
- **Local library** `src/lib/library/library.ts` — reactive `localStorage` store
  (`useSyncExternalStore`, cross-tab via `storage` event) for `saves` + `history`.
  **Phase-4 placeholder**: UI imports only this module, so Phase 5 swaps the
  internals for Supabase + IndexedDB with no component changes (same pattern as
  `quizRepository`). `QuizPlayer` now calls `recordCompletion` on finish
  (replacing the Phase-2 deferred NOTE).
- Verified: `tsc` clean, ESLint clean, 7 Vitest tests pass, `next build` succeeds
  (routes `/`, `/explore`, `/saved`, `/quiz/[slug]`). Playwright screenshots at
  360×720 confirm the shell, Saved/History views, and nav render correctly.
- Note: Zustand (named in the stack) not added — the lightweight
  `useSyncExternalStore` store covers Phase-4 needs dependency-free.

### Phase 5b — PWA app-shell offline boot ✅
- Chose a **hand-written service worker** (`public/sw.js`) over Serwist: `@serwist/next`
  injects a webpack plugin that's incompatible with this project's Turbopack build,
  so a small dependency-free SW avoids changing the build pipeline.
- Strategies: navigations → network-first w/ cached fallback (offline boot); hashed
  `/_next/static` + assets → cache-first; other same-origin GETs → stale-while-revalidate.
  Supabase/cross-origin requests are skipped (so live data still hits the network).
- `public/manifest.webmanifest` + `public/icon.svg` (amber map-pin) → installable PWA;
  `layout.tsx` wires `manifest`, `themeColor`, and apple-web-app metadata.
- SW registered from `AppInit` in **production only** (a dev SW fights Turbopack HMR).
- Verified live: built + `next start`, drove Chromium **offline** — the app shell boots
  from cache (`serviceWorker.controller` set; header + bottom nav render; offline nav to
  `/saved` works), with no runtime errors. Catalog shows "Loading…" offline (by design).
- Phase 5 now complete (5a data layer + 5b PWA). Remaining live steps are operational:
  `supabase db push` + enable anonymous sign-ins in the Supabase dashboard.

### Phase 5a — Accounts + offline data layer ✅ (code; live sync needs a real Supabase project)
- **Anonymous auth** (`src/lib/auth/authStore.ts`): signs in anonymously on first
  visit → `user_id`; reactive `useUser()`; `ensureProfile` upsert; `signOut()`
  wipes IndexedDB (shared-device safety). Degrades to local-only if Supabase env
  is missing or anon sign-in is disabled.
- **Migration** `…_profiles_autocreate.sql`: trigger to create a `profiles` row
  on new `auth.users` (FK target for saves/history). Client `ensureProfile`
  upsert is a belt-and-suspenders fallback. **Needs `supabase db push` + the
  "Enable anonymous sign-ins" toggle in the Supabase dashboard.**
- **IndexedDB** (`src/lib/db/idb.ts`, via `idb`): stores `quizzes` (content),
  `saves`, `history`, `outbox`, `meta`. Fully guarded — no-ops where IndexedDB is
  absent (SSR/tests).
- **Library reworked** (`src/lib/library/library.ts`): same UI surface
  (`useSaves`/`useHistory`/`toggleSave`/`recordCompletion`/…), now optimistic
  in-memory cache → write-through to IndexedDB + Supabase, with an **outbox** for
  offline writes flushed on reconnect; `initLibrary` hydrates from IndexedDB then
  pulls remote; pure join helpers in `derive.ts` (unit-tested).
- **Offline replay:** `quizRepository.getQuizBySlug` caches fetched quizzes and
  falls back to the IndexedDB cache on network failure.
- **Bootstrap:** `AppInit` (mounted in `AppChrome`) runs sign-in, hydration, and
  an `online` listener that flushes the outbox.
- Fixed a typing gap: added `Relationships: []` to each table in the hand-written
  `Database` type (required by this `@supabase/supabase-js` version for
  insert/upsert/maybeSingle).
- Verified: `tsc`/ESLint clean, 10 Vitest tests pass (added `derive.test.ts`),
  `next build` succeeds. Playwright smoke (real Chromium IndexedDB, Supabase
  unreachable = local-only): Save persists to IndexedDB and re-hydrates across
  reload, Saved tab lists it, **no runtime errors**.
- **Deferred to 5b:** Serwist PWA service worker (app-shell precache for offline
  boot) — has Next 16/Turbopack compatibility risk and needs live testing.

### Phase 4 — UI pass: follow the exported wireframe design ✅
- Pulled the source design from the repo's `RoadTrip Trivia.zip` (exported Claude
  Design wireframes + `design-canvas.jsx`) and restyled every screen to match it.
- **Fonts:** added **Space Mono** (`next/font`) for the small uppercase
  labels/tags/meta; clean sans (Geist) for content — the wireframe's mono+sans
  pairing.
- **QuizCard:** elevated white card · cream `#FFF8EC` icon tile with amber border
  + per-park emoji (`src/lib/parkIcon.ts`) · Space Mono amber tag
  (`DIFFICULTY · 20 QS`) · amber-outline Play pill. Titles drop the redundant
  " Trivia" suffix (`parkName`) and wrap to two lines (`line-clamp-2`) so long
  names like "Great Smoky Mountains" never ellipsize.
- **BottomNav:** clean line-icon set (home/compass/heart), filled + amber when
  active, Space Mono labels, subtle top border.
- **Home:** brand header + map glyph, passive search pill → Explore, "Recommended
  for you" section. **Explore:** title/subtitle, functional search pill, result
  count. **Saved:** segmented toggle on canvas `#f0eee9`; History rows show a
  cream/amber score badge + Retry; Saved rows keep Play/Download/Remove.
- **QuizPlayer (headline change):** full amber `#F5A623` header (Q badge · park
  pill · charcoal progress bar) → white question bubble → dark `#1a1a1a` answer
  panel with A–D badges, green ✓ / red ✕ feedback, dimmed others, and an
  "AUTO-ADVANCES…" hint. Score screen now uses an amber **score ring**. Kept the
  test-critical markup (`Q n/total`, `bg-green-600`/`bg-red-600`, "Quiz
  complete!", Retry/Home) so all 7 Vitest tests still pass.
- Verified: `tsc` clean, ESLint clean, 7 tests pass, `next build` succeeds.
  Playwright screenshots (360×760) confirm every screen matches the wireframes.

### Next: Phase 5 — Auth + offline (Supabase anon sign-in, IndexedDB, outbox sync)

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
