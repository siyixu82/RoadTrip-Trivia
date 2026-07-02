# RoadTrip Trivia — Build Plan

The phased plan for building the MVP defined in [docs/PRD-MVP.md](docs/PRD-MVP.md),
following the architecture in [docs/ENGINEERING-DESIGN.md](docs/ENGINEERING-DESIGN.md).
Day-to-day progress notes live in [log.md](log.md); this file is the high-level map.

## Guiding principles

- **Vertical slices first.** Get a playable quiz on a real backend early (Phases 0–2),
  then expand breadth. The riskiest thing to validate is whether the core loop feels good.
- **Sample content before bulk.** Build the play loop against a few quizzes, freeze the
  question shape, *then* generate the catalog — so a shape change doesn't mean redoing 1,000+ questions.
- **Repository layer.** The UI talks only to a data/repository layer, so the offline/
  IndexedDB store can slot in (Phase 5) without touching components.
- **Offline & auth last.** They're the most complex and most independent; the repository
  boundary lets them land without UI churn.
- **Each phase ships on its own branch → PR → `main`**, with the change verified before merge.

## Status at a glance

| Phase | Scope | Status |
|------:|-------|--------|
| 0 | Scaffold + Supabase wiring + Vercel deploy | ✅ Done |
| 1 | Database schema + RLS + 3 sample quizzes | ✅ Done |
| 2 | Core quiz play loop | ✅ Done (PR #5) |
| 3 | Bulk content (curated batch + pipeline) | ✅ Done (PR #6) |
| 4 | Home / Explore / Saved tabs | ✅ Done |
| 5 | Accounts (anonymous auth) + offline (IndexedDB/PWA) | ✅ Done (5a data + 5b PWA); anon auth enabled + migration applied; deploy branch to go live |
| 6 | Polish + ship | ⬜ Planned |

---

## Phase 0 — Scaffold ✅

**Goal:** a deployable skeleton on a real backend.

- Next.js 16 (App Router, TypeScript, Tailwind v4) via `create-next-app`.
- Supabase browser client singleton + hand-authored `Database` types.
- `.env.local` (git-ignored) for the Supabase URL + anon key; `.env.example` template.
- Deployed to Vercel at https://roadtrip-trivia.vercel.app with env vars set.

**Done when:** the app builds, deploys, and connects to Supabase. ✅

## Phase 1 — Schema + sample content ✅

**Goal:** exercise the data model end-to-end.

- Supabase CLI migrations (`supabase/migrations/`), versioned in-repo.
- Four tables — `profiles`, `quizzes`, `saves`, `history` — with indexes and **Row-Level
  Security** (users own their rows; `quizzes` publicly readable, writes denied to anon).
- 3 sample quizzes to validate the `questions` jsonb shape:
  `[{ id, prompt, options[4], correct_index }]`.

**Done when:** schema is applied to remote and RLS verified. ✅

## Phase 2 — Core play loop ✅

**Goal:** the heart of the product — pick a quiz, play, score.

- Repository layer (`listQuizzes`, `getQuizBySlug`) — the only thing the UI imports for data.
- Quiz player: 20 questions, A–D options, correct→green / wrong→red, ~1.1s **auto-advance**
  (no Next button), progress bar, score screen with **Retry / Home**.
- Vitest + Testing Library tests covering feedback, auto-advance, scoring, and retry.

**Deferred:** writing a `history` row on completion needs an authenticated `user_id`
(RLS) → lands in Phase 5. The score shows; it just isn't persisted yet.

**Done when:** the loop is playable and tested. ✅

## Phase 3 — Bulk content (curated batch + pipeline) ✅

**Goal:** a real catalog, plus a repeatable way to grow it.

- `content/quizzes/*.json` — per-park content files (source of truth).
- `scripts/load-quizzes.mjs` — validates and **upserts by slug** via the service-role key
  (idempotent; re-run as the catalog grows).
- `scripts/shuffle-options.mjs` — deterministic, idempotent answer-position spread.
- **12 parks / 240 questions** loaded and verified live.

**Open item:** questions are self-consistency-checked but not independently fact-checked
(the PRD flags authoring/QA as open). Corrections = edit JSON, re-run loader.

**Future:** scale toward all 63 parks (and/or the AI-generation path from the eng design)
reuses this same pipeline.

**Done when:** the catalog is loaded and readable via the app's anon path. ✅

---

## Phase 4 — Home / Explore / Saved tabs ⏳ (next)

**Goal:** the real three-tab navigation from the PRD (replaces the temporary home list).

- **Bottom nav:** HOME · EXPLORE · SAVED.
- **Home:** recommended quiz cards (title, "20 questions", Save ♡, Play).
- **Explore:** full catalog with **search/filter** by name/state.
- **Saved:** toggle between **Saved** (bookmarks: Play / Download / Remove) and
  **History** (date, score, Retry).

**Dependencies:** the **Saved** and **History** views need an authenticated user, so the
data-backed parts of this tab interlock with Phase 5. Option: build the UI shell + Home +
Explore now, wire Saved/History when auth lands (or pull auth forward).

**Done when:** all three tabs render and Explore search works against the live catalog.

## Phase 5 — Accounts + offline ⬜

**Goal:** persistence and offline play.

- **Anonymous auth** on first visit (Supabase) → a `user_id` + `profiles` row with no signup.
  Upgradeable to email/OAuth later. **Wipe IndexedDB on sign-out** (shared-device safety).
- **Persist completions** to `history`; **saving** quizzes writes `saves` — unblocks the
  History view and Save buttons from Phase 4.
- **Offline:** IndexedDB (via `idb`) caches saved/completed quizzes + an outbox for writes;
  Serwist precaches the app shell (PWA); flush outbox + pull deltas on reconnect.

**Done when:** a user can sign in anonymously, complete a quiz that's recorded, save a quiz,
and replay a saved quiz offline.

## Phase 6 — Polish + ship ⬜

**Goal:** make it feel finished and launch-ready.

- Hand-drawn "wireframe sketch" aesthetic pass (amber `#F5A623`, cream `#FFF8EC`, dark panels).
- PWA install affordance + `navigator.storage.persist()`.
- Accessibility, loading/empty/error states, final QA + content fact-check pass.
- Production deploy.

**Done when:** the MVP is visually coherent, installable, and shipped.

---

## Out of scope (→ V1)

AI/topic generation, GPS/location, Read-Aloud / Driver Mode, the full Explore marketplace,
gamified results, Settings/Profile, resume-in-progress, multiplayer, payments. See
[docs/PRD-V1.md](docs/PRD-V1.md). The schema and repository layer are built to grow into
these without rewrites.
