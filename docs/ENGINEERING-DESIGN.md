# RoadTrip Trivia — Engineering Design (MVP)

> **Status: Draft — open for review.** Comment inline on any line.
>
> Scope: the engineering design for the **MVP** defined in [`PRD-MVP.md`](PRD-MVP.md)
> — a mobile-first **web app on Vercel** with **no accounts** and **offline play**.
> Forward-looking notes for V1 (accounts, sync, AI) are called out as such.

---

## 1. Context & Constraints

From the MVP PRD, the engineering-relevant facts are:

- **Platform:** mobile-first responsive web app, deployed on **Vercel**, installable
  as a **PWA**.
- **No backend accounts/auth, no cloud sync.** Personalization is per-device only.
- **Content** is a fixed catalog of pre-generated quizzes — one per U.S. National Park
  (~63), each **20 multiple-choice questions**. Read-only, ships with the build.
- **User data:** saved quizzes, downloaded quizzes, and completed-quiz history (scores).
- **Offline is a first-class requirement** (planes, remote parks, no data abroad).

### Data sizing (drives the whole design)
A quiz is ~20 questions × (prompt + 4 options) ≈ **1–3 KB** of JSON. The **entire
catalog is ~100–300 KB**. This is small enough to **ship and cache in full** — we never
need a database to *serve content* in the MVP. This single fact is why the answer to
"do we need Supabase?" is **no, not yet** (see §4).

---

## 2. Recommended Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** on Vercel | First-class Vercel target; static generation for the catalog; easy PWA. |
| Quiz content | **Static JSON in the repo** (`/data/quizzes/*.json`), bundled/SSG | Read-only, tiny, versioned with the build; no DB or API needed. |
| PWA / offline | **Serwist** (`@serwist/next`, Workbox-based) | Precaches app shell + catalog; runtime caching; modern, maintained. |
| Local user data | **IndexedDB** via **`idb`** (or Dexie if we want richer queries) | Async, structured, large quota; right home for history + downloads. |
| Tiny flags | **localStorage** | Only for trivial prefs (e.g. last-open tab). Not for bulk data. |
| State | React + lightweight store (**zustand**) behind a persistence module | Keeps UI decoupled from storage; swappable for V1 sync. |

No server, no database, no auth in the MVP. Everything runs as a static/edge web app
plus client-side storage.

---

## 3. Where Data Lives (browser storage)

Three browser storage mechanisms exist; we use each for what it's good at:

| Mechanism | Capacity | Sync/async | Use in MVP |
|---|---|---|---|
| **localStorage** | ~5 MB, strings | sync (blocks UI) | Trivial flags only. |
| **IndexedDB** | Hundreds of MB+ (quota-based) | async | **Primary store**: history, saves, downloaded quiz content. |
| **Cache Storage** (service worker) | quota-based | async | App shell + static asset/catalog responses (PWA offline). |

**Decision:** IndexedDB is the source of truth for user data and downloaded content;
the service-worker Cache holds the app shell and the static catalog so the app boots and
the quiz list render offline. localStorage is incidental.

### Local object stores (IndexedDB schema)
```
db: roadtrip-trivia (v1)
  saves        { quizId (key), savedAt }
  downloads    { quizId (key), downloadedAt }     // pin flag; content also precached
  attempts     { id (key), quizId, completedAt, score, total:20, answers?[] }  // history
  quizzes?     { quizId (key), ...content }        // optional: explicit copy of pinned quizzes
```
Indexes: `attempts.by_quizId`, `attempts.by_completedAt` (for the History view),
`saves.by_savedAt`. The schema is intentionally **flat and entity-shaped** so it maps
1:1 onto Postgres tables if/when we add Supabase in V1 (§6).

> Note: correct answers live in the client (in the catalog JSON). For low-stakes trivia
> that's acceptable. If anti-cheat ever matters (leaderboards in V1), grading moves
> server-side.

---

## 4. Do we need Supabase? — Evaluation

**Short answer: not for the MVP. Go fully client-side. Adopt Supabase in V1 when
accounts and cross-device sync arrive.**

**Why Supabase is the wrong tool for *this* MVP:**
- It's a hosted **Postgres + Auth + Storage + Realtime + Edge Functions** backend. Its
  value is *shared, multi-device, server-persisted* data. The MVP has **none of that** —
  no accounts, no sync, per-device data only.
- Content is static and tiny, so we don't need a DB to serve it.
- Adding it now means: a network dependency on the critical path, an auth surface to
  build, RLS policies to get right, and a backend to operate — all to store a list of
  scores that lives perfectly well on the device. It would also **complicate offline**
  (the very thing we must nail), because reads/writes would want the network.
- It slows the MVP's actual goal: validating the core loop.

**What we do instead:** IndexedDB + service-worker cache. This is **local-first**, which
is the ideal architecture for an offline-required app — every read and write is local
and instant, online or not.

**When Supabase becomes the right call (V1):**
- **Accounts + cross-device sync** (Auth + Postgres) — carry history/saves between phone
  and laptop.
- **AI quiz generation** (Edge Functions calling an LLM) — needs a server anyway.
- **Marketplace / shared content & leaderboards** (Postgres + RLS, maybe Realtime).

Because the local schema (§3) is already entity-shaped, the V1 migration is additive: the
same `attempts`/`saves` become Postgres tables, and we add a sync layer (§6) rather than
rewrite storage. (Alternatives if we only ever need sync-without-SQL: Firebase, or a
sync engine like ElectricSQL/PowerSync/RxDB. Supabase is the best default given likely
V1 needs — relational data, auth, and server functions for AI.)

---

## 5. Offline & Persistence Design

The PRD requires quizzes to be playable with no connection. Here's how persistence works
offline.

### 5.1 The key insight
In the MVP, **all writes are already local** (IndexedDB) — there is no server to reach.
So "saving works offline" is automatic; the only thing that ever needs the network is the
**initial load** of the app and catalog. The service worker removes even that after the
first visit.

### 5.2 Service-worker caching strategy (Serwist/Workbox)
- **Precache on install:** the app shell (HTML/CSS/JS) **and the full quiz catalog
  JSON** (it's tiny). After the first successful load, the entire app — list, every
  quiz, gameplay — works offline by default.
- **Runtime caching:** images/fonts via `StaleWhileRevalidate`; navigations fall back to
  the cached shell when offline.
- **Versioning:** a new deploy ships a new precache manifest; the SW updates in the
  background and activates on next launch (show a subtle "update available" refresh).

### 5.3 What "Download for offline" means here
Since the catalog is precached, the app is *already* offline-capable. So **Download is an
explicit "pin"**, not a fetch:
1. Write a `downloads` record (and optionally copy the quiz content into the `quizzes`
   store) in IndexedDB.
2. Call **`navigator.storage.persist()`** to request **persistent** storage so pinned
   content and history are **not evicted** under storage pressure (without this,
   browser-managed "best-effort" storage *can* be cleared).
3. Surface it in **Saved → downloaded** with a `Downloaded ✓` state.

This cleanly resolves the PRD open question ("what does download add if content is
bundled?"): **bundling makes it work offline; pinning guarantees it stays and makes the
guarantee visible to the user.**

### 5.4 Offline reads/writes at runtime
- **Play offline:** quiz content comes from cache/IndexedDB; gameplay is pure client
  logic. No network.
- **Record a completion:** write an `attempts` row to IndexedDB — succeeds offline.
- **Save / unsave / pin:** mutate `saves`/`downloads` in IndexedDB — succeeds offline.
- **Connectivity UI:** reflect `navigator.onLine` + `online`/`offline` events with a
  small banner; nothing is blocked while offline.

### 5.5 Durability & limits
- Request persistent storage (`navigator.storage.persist()`); show usage via
  `navigator.storage.estimate()`.
- Quotas are large relative to our tiny data, so eviction is the only real risk —
  persistence mitigates it. Provide a "clear history/downloads" control for the user.

---

## 6. Forward Look — V1 sync (when accounts arrive)

Keep **local-first**; add a sync layer on top of the same IndexedDB stores:
- **Auth:** Supabase Auth; on sign-in, associate the device's local rows with a user id.
- **Schema:** `attempts`, `saves`, `downloads` become Postgres tables with `user_id` +
  RLS so each user sees only their rows.
- **Sync (outbox pattern):** every local mutation is also appended to an **outbox**; when
  online, flush to Supabase, then pull remote changes since a cursor.
- **Conflict policy:** history is **append-only** → union by `attempt.id` (no conflicts);
  saves/downloads use **last-write-wins** with tombstones for removes.
- **AI generation (V1):** an Edge Function calls the LLM, returns quiz JSON in the same
  shape as the static catalog, cached locally like any other quiz.

This is purely additive — no storage rewrite, because the MVP schema was designed to map
onto it.

---

## 7. Risks & Open Questions

- **Storage eviction** without `persist()` — mitigated in §5.5; confirm we call it on
  first download/completion.
- **iOS Safari PWA quirks** — IndexedDB and SW caches can be cleared after long disuse;
  persistent-storage support is weaker than Chromium. Validate on iOS early.
- **Catalog growth** — if content later balloons (V1 AI/marketplace), revisit
  precache-everything vs on-demand download (the Download flow already supports per-quiz
  pinning).
- **Answer exposure** — acceptable for MVP; revisit if leaderboards make cheating matter.
- **Open from PRD:** history granularity (every attempt vs best/latest) changes whether
  `attempts` is append-only or upserted — recommend **append-only** (simplest, syncs
  cleanly, supports "best score" as a query).
