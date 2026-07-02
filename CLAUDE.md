# RoadTrip Trivia — CLAUDE.md

## Project Overview

**RoadTrip Trivia** is a mobile-first web app serving place-based trivia to travelers. The MVP focuses on pre-generated quizzes for all 63 U.S. National Parks (20 multiple-choice questions each), offline play, and lightweight personal organization. No AI generation or accounts are required to play in the MVP vision, but the engineering design uses Supabase for extensibility.

## Key Docs

| File | Purpose |
|---|---|
| [docs/PRD-MVP.md](docs/PRD-MVP.md) | **Authoritative MVP scope** — what's being built |
| [docs/PRD-V1.md](docs/PRD-V1.md) | Post-MVP vision (AI generation, GPS, Driver Mode, marketplace) |
| [docs/ENGINEERING-DESIGN.md](docs/ENGINEERING-DESIGN.md) | Architecture, stack, data model, offline/sync strategy |
| [log.md](log.md) | Running build log (newest entries on top) |

## Tech Stack

- **Framework:** Next.js 16 (App Router) deployed on Vercel
- **Backend:** Supabase — Postgres + Auth + Storage + Edge Functions
- **Client SDK:** `@supabase/supabase-js`
- **PWA / Offline:** Serwist (`@serwist/next`, Workbox-based) for app-shell precaching
- **Local cache:** IndexedDB via `idb` — stores only saved/completed quizzes, never the full catalog
- **State:** React + Zustand behind a repository layer (hides Supabase vs IndexedDB from UI)

## Project Layout

- `src/app/` — Next.js App Router pages
- `src/components/` — React components
- `src/lib/supabase/` — Supabase client singleton (`client.ts`) + hand-authored `Database` types (`types.ts`)
- `.env.local` — Supabase URL + anon key (git-ignored); `.env.example` is the template

## Architecture

```
Next.js PWA (Vercel)
       │  HTTPS (supabase-js)
       ▼
  Supabase (source of truth)
  ├── Auth → user_id (anonymous by default; upgradeable)
  ├── Postgres: profiles, quizzes, saves, history (RLS-protected)
  ├── Storage: images
  └── Edge Functions: V1 AI generation
       ▲ sync (pull saved/completed; outbox for offline writes)
       ▼
  IndexedDB (per-device cache)
  ├── quizzes (saved + completed content only)
  ├── saves, history, outbox (offline write buffer), meta
```

## Database Schema (Supabase)

- **`profiles`** — mirrors `auth.users`; holds display name, avatar, preferences jsonb
- **`quizzes`** — catalog content; `questions` column is jsonb `[{id, prompt, options[4], correct_index}]`; `created_by` (null for the official catalog)
- **`saves`** — user×quiz bookmark; `is_offline` flag = "Download" in the UI
- **`history`** — append-only attempt log; `score`, `question_count`, `completed_at`

RLS: users can only read/write their own rows. Quizzes are publicly readable.

## Auth Strategy

- **Anonymous sign-in on first visit** — user gets a `user_id` immediately, no signup friction.
- Upgrade to email/OAuth later; anonymous account is converted, not replaced.
- **On sign-out: clear IndexedDB** (`quizzes`, `saves`, `history`, `outbox`) to prevent user A's data leaking to user B on a shared device.
- `meta.user_id` in IndexedDB tracks whose data is currently cached.

## Offline Strategy

- **App shell** precached by service worker → boots offline.
- **Reads offline:** saved/completed quizzes + history from IndexedDB only. Full catalog requires network (by design).
- **Writes offline:** enqueue in `outbox`; flush to Supabase on reconnect.
- **Conflict resolution:** `history` is append-only (union by id); `saves` is last-write-wins by `saved_at`.
- **Durability:** server is source of truth; IndexedDB eviction (Safari 7-day cap) only degrades offline availability, not data integrity.

## MVP Feature Set

| Tab | Content |
|---|---|
| **Home** | Recommended quiz cards (park name, 20 Q, Save ♡, Play) |
| **Explore** | Full catalog with search/filter by park name or state |
| **Saved** | Toggle: Saved bookmarks (Play / Download / Remove) ↔ History (date, score X/20, Retry) |
| **Quiz** | Home link · Q position + progress bar · four A–D options · Back/Next controls · ~2.5s auto-advance · score screen at Q20 |

Quiz UX: correct answer turns green ✓, wrong pick turns red ✕, then auto-advances after ~2.5s. **Back/Next** buttons allow manual navigation and reviewing answers (which cancels auto-advance); a header **Home** link exits mid-quiz. In-progress answers persist in `sessionStorage`, so a backgrounded/resumed app restores the exact question and picks (cleared on app termination).

## What's Out of MVP (V1)

AI/topic generation · GPS/location awareness · Read-Aloud / Driver Mode · Explore marketplace (categories, featured, badges) · gamified results (XP/streak/share) · Settings/Profile · resume-in-progress · multiplayer · payments

## Design Language

- **Aesthetic:** hand-drawn "wireframe sketch" — rounded corners, dashed dividers, casual display font
- **Colors:** amber `#F5A623` (primary/CTA) · cream `#FFF8EC` (background) · dark charcoal `#1a1a1a` (answer panels) · green/red for feedback
- **Target viewport:** single mobile phone screen (~320×640); core screens should not require scrolling

## Build Phases

Phase 0 scaffold → Phase 1 schema + 3 sample quizzes → Phase 2 play loop → Phase 3 bulk content → Phase 4 catalog/library → Phase 5 auth/offline → Phase 6 polish/ship.

## Open Questions (from PRD)

- Park scope: 63 National Parks only, or include monuments/historic sites?
- Who authors and QA-checks the questions?
- ~~Is "Download" PWA service-worker caching, or just an affordance?~~ **Resolved:** real caching — stores the quiz's questions in IndexedDB + pre-caches its page in the service worker for genuine offline play.
- History: store every attempt, or best/latest per quiz?
- Should Home be a curated subset vs. mirroring the full Explore catalog?
