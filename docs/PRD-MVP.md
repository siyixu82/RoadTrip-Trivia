# RoadTrip Trivia — MVP Product Requirements Document

> **Status: Draft — open for review.** Leave inline comments on any line in this
> PR's "Files changed" tab and I'll respond and revise here. Open questions are
> collected in §12.
>
> **Scope note:** This document defines the **MVP**. All previously-specified
> features (AI quiz generation, location awareness, read-aloud/driver mode, the
> Explore marketplace, gamified results, settings/accessibility, etc.) have been
> moved to **V1** and are captured in [`PRD-V1.md`](PRD-V1.md).

---

## 1. MVP Overview

RoadTrip Trivia is a mobile trivia app for people on road trips. The **MVP** proves
the core loop with a focused, fully static product: a library of **pre-generated
quizzes for the U.S. National Parks**, the ability to **play a 20-question quiz**,
and lightweight personal organization — a **history of completed quizzes with
scores**, and the ability to **save and download quizzes for offline use**.

The MVP deliberately ships **no AI generation, no location/GPS, no read-aloud, and
no marketplace**. Those are V1. The goal is to validate that users will pick a
park quiz, play it through, and come back — and that offline saving matters for the
road-trip context (where connectivity is unreliable).

### MVP Goals
- Ship a complete, playable trivia experience with **zero backend AI dependency**.
- Let a user go from open → pick a park quiz → finish 20 questions in one sitting.
- Make quizzes **usable offline** so a dead-zone on the highway doesn't break play.
- Keep a simple record of what the user has **completed** (with scores) and **saved**.

### What the MVP validates
- Do users engage with **pre-authored, place-based** quizzes (national parks)?
- Is the **20-question** length right for a road-trip session?
- Do users value **offline download** enough to use it?
- Does **completion history with scores** drive replay?

### Target users (MVP)
- **Road trippers** (driver's passengers and solo travelers at rest stops) who want
  a quick, self-paced quiz tied to where they're headed.
- All users are treated the same in MVP — **no accounts, no personalization beyond
  the device's own saved/completed data.**

---

## 2. MVP Scope at a Glance

**In scope (MVP):**
1. Pre-generated quizzes for all U.S. National Parks (20 questions each).
2. Main page showing recommended quizzes (= the full pre-generated library).
3. Quiz experience: select a quiz and complete its 20 questions.
4. Completed page: history of completed quizzes and scores.
5. Saved & Downloaded page: save quizzes and download them for offline play.

**Out of scope (→ V1):** AI/topic quiz generation, location awareness & GPS,
Read-Aloud / TTS / Driver Mode, Mode Select, the Explore marketplace, gamified
results (XP/streak/share/next-up), the Settings/Profile screen, resume-in-progress,
accounts/auth/cloud sync, multiplayer/social, payments. See §11 and `PRD-V1.md`.

---

## 3. Design Language & Tone

The MVP keeps the established brand identity (full detail in `PRD-V1.md` §2):

- **Style:** hand-drawn, friendly "wireframe sketch" aesthetic — rounded corners,
  dashed dividers, a casual handwritten display font with a monospace font for
  small labels.
- **Primary brand color:** warm amber/orange (`#F5A623`) for primary actions and the
  quiz experience; warm cream (`#FFF8EC`) backgrounds; dark charcoal (`#1a1a1a`)
  answer panels.
- **Feedback colors:** green for correct, red for incorrect.
- **Frame:** every screen sits inside a phone shell (~320×640). Core screens should
  fit without scrolling; list-heavy screens (Main, Saved & Downloaded, Completed) may
  scroll.

---

## 4. Global Navigation

A persistent **bottom navigation bar** with **three tabs** (the V1 EXPLORE and
PROFILE tabs are deferred):

1. **HOME** — the main page / recommended quizzes.
2. **SAVED** — Saved & Downloaded quizzes.
3. **COMPLETED** — history of completed quizzes and scores.

The active tab is amber; inactive tabs are muted gray. The Quiz screen is reached
by selecting a quiz (no nav tab) and hides the nav bar while playing.

---

## 5. Features & Screens

### 5.1 Pre-Generated National Park Quizzes (content)
The MVP ships a fixed, **pre-generated** (human-curated / pre-authored) quiz library.

Requirements:
- **Coverage:** one quiz for **every U.S. National Park** (63 designated parks as of
  2026 — see Open Questions on exact scope).
- **Length:** each quiz has **exactly 20 questions**.
- **Question format:** single-answer **multiple choice**, four options labeled A–D,
  with one correct answer and a short explanation per question.
- **Content mix:** questions cover the park's geography, wildlife/flora, history,
  landmarks, and notable trivia.
- **Static & bundled:** quiz content ships with the app (no server generation). It is
  versioned with the build; there is no AI generation in MVP.
- **Metadata per quiz:** park name, location (state/region, display only), a question
  count (20), and a difficulty label (optional, display only).

### 5.2 Main Page — Recommended (`HOME`)
The entry screen. In MVP, "recommended" simply surfaces the **entire pre-generated
library**.

Must include:
- **Header:** app name "RoadTrip Trivia" with the map-pin glyph.
- **"Recommended For You"** (or "All Park Quizzes") — a scrollable list/grid of quiz
  cards covering all national-park quizzes. Each card shows: park name, an
  icon/thumbnail, "20 questions", a **Save (♡)** control, and a **Play** action.
- An optional **simple text filter** to find a park by name (plain string match — no
  AI, no remote search).
- Bottom navigation (HOME active).

> Note: location-seeded / personalized recommendations are **V1**. MVP recommends the
> full catalog, in a stable order (e.g. alphabetical, or a curated featured order).

### 5.3 Quiz Experience (`QUIZ`)
The core gameplay, reached by tapping **Play** on any quiz.

Must include:
- **Header zone:** current position (e.g. "Q 4/20"), the quiz/park name, and a
  **progress bar**. (A timer is optional in MVP.)
- **Question card:** the question text, large and centered, plus four answer options
  A–D as large, thumb-friendly tap targets.
- **Immediate feedback (graded state):** when an option is chosen, the **correct**
  option turns **green with ✓** and a **wrong** pick turns **red with ✕**, with a
  short explanation strip for the correct answer.
- **Advance:** after answering, the user advances to the next question via a **Next**
  control (manual advance in MVP; auto-advance / no-skip driver behavior is V1).
- **Completion:** after Q20, a **completion summary** shows the final **score (X/20)**
  and offers **Retry** and **Back to Home**. Completing a quiz **records an entry in
  Completed history** (§5.4).

> Note: Read-Aloud / TTS narration, Mode Select (Read Aloud vs Quiet), and the
> gamified results screen (score ring, streak, XP, share, "Play Next") are **V1**.
> MVP completion is a simple score summary.

### 5.4 Completed Page (`COMPLETED`)
The user's record of finished quizzes and how they did.

Must include:
- Title "Completed" (or "Recently Played").
- A **list of completed attempts**, each row showing: the quiz/park name, **when it
  was completed** (Today, Yesterday, or a date), and the **score earned** (e.g.
  16/20), plus a **Retry** action.
- Persisted **locally on the device** so the list survives app restarts (no account).
- Bottom navigation (COMPLETED active).

### 5.5 Saved & Downloaded Page (`SAVED`)
The user's personal library for quizzes they want to keep and play offline.

Must include:
- Title "Saved & Downloaded".
- **Saved quizzes:** quizzes the user bookmarked (via the ♡ on the main page or quiz
  card). Each row shows the quiz, its question count (20), a **Play** action, a
  **Download** control, and a **remove (✕)** control.
- **Downloaded quizzes:** quizzes the user has explicitly **downloaded for offline
  use**. Each shows a **Downloaded ✓** state, supports **Play offline** (works with
  no connection), and a **remove download** control. An optional storage-used hint
  may be shown.
- **Offline behavior:** a downloaded quiz is fully playable with no network. (Because
  MVP content is static/bundled, "download" persists the quiz to local storage and
  marks it available offline — see Open Questions on bundled-vs-fetched.)
- Bottom navigation (SAVED active).

---

## 6. Key Flows (MVP)

1. **Play a recommended quiz:** Home → tap **Play** on a park quiz → answer 20
   questions → completion summary → recorded in Completed.
2. **Save for later:** Home (or quiz card) → tap **♡ Save** → quiz appears under
   Saved & Downloaded.
3. **Download for offline:** Saved & Downloaded → tap **Download** on a saved quiz →
   quiz becomes playable offline.
4. **Play offline:** (no connection) Saved & Downloaded → **Play offline** on a
   downloaded quiz → complete → recorded in Completed.
5. **Review history:** Completed → see past quizzes with scores → **Retry** any.
6. **Replay:** Completed (Retry) or Saved (Play) → Quiz → new Completed entry.

---

## 7. Functional Requirements (MVP)

- **MFR-1 — Pre-generated park quizzes:** Ship static, pre-authored quizzes for all
  U.S. National Parks, each with exactly **20 multiple-choice questions**.
- **MFR-2 — Recommended catalog:** The main page presents the full pre-generated
  library as recommended quizzes, browsable and selectable.
- **MFR-3 — Quiz play:** Users can select a quiz, answer 20 questions with immediate
  correct/incorrect feedback and an explanation, and reach a completion score.
- **MFR-4 — Completed history & scores:** Completing a quiz records it with the date
  and score; the Completed page lists past attempts and supports retry. Persisted
  locally.
- **MFR-5 — Save:** Users can save/bookmark quizzes and see them in Saved &
  Downloaded; saves persist locally.
- **MFR-6 — Download & offline play:** Users can download saved quizzes for offline
  use and play them with no network connection; downloads can be removed.
- **MFR-7 — Local persistence:** Saved quizzes, downloads, and completed history
  persist on-device across sessions with **no account or cloud sync**.

---

## 8. Data & Persistence (MVP)

- **Content:** quiz catalog is static and shipped with the app build.
- **User state:** three local collections — **Saved** (quiz IDs), **Downloaded**
  (quiz IDs + cached content/availability flag), and **Completed** (per-attempt
  records: quiz ID, completed-at timestamp, score, optionally per-question answers).
- **Storage:** on-device local storage only (e.g. app storage / local DB). No
  accounts, no auth, no remote sync in MVP.

---

## 9. Out of Scope (MVP)

- AI / two-path quiz generation (type-a-topic, location-generated quizzes).
- Location awareness, GPS, and location-seeded recommendations.
- Read-Aloud / TTS narration, Mode Select, and Driver Mode.
- Explore marketplace (categories, featured, badges, marketplace search).
- Gamified results: score ring, streak, XP, Share Score, "Play Next" suggestions.
- Settings / Profile screen and accessibility preferences.
- Resume of an in-progress quiz.
- Accounts, authentication, cloud sync, multiplayer/social, payments.

All of the above are planned for **V1** — see §11 and `PRD-V1.md`.

---

## 10. Success Metrics (MVP)

- **Quiz completion rate:** % of started quizzes finished through Q20.
- **Replay rate:** % of users who complete ≥2 quizzes.
- **Download adoption:** % of active users who download ≥1 quiz for offline use.
- **Return rate:** % of users who return and view Completed history.

---

## 11. V1 — Post-MVP Roadmap (moved from the previous PRD)

Everything previously specified that is **not** in the MVP is deferred to **V1** and
documented in full in [`PRD-V1.md`](PRD-V1.md). Summary of what moves:

- **AI / two-path quiz generation** — type any topic or pick a place and generate a
  quiz on demand (replaces MVP's static-only catalog).
- **Location awareness** — current/nearby location, changeable location, and
  location-seeded recommendations.
- **Mode Select + Read-Aloud / Driver Mode** — choose Read Aloud (driver-safe,
  auto-narrated, auto-advance) vs Quiet; TTS narration with mute/replay.
- **Explore marketplace** — category chips, "Featured This Week," badges
  (TRENDING/NEW/POPULAR/STAFF PICK), marketplace search.
- **Gamified results** — score ring, time/streak/XP stats, per-question review with
  explanations, "Play Next" suggestions, Play Again / Share Score.
- **Settings / Profile** — profile card, Audio & Accessibility (voice, speed,
  auto-mute), Driver Mode controls, quiz preferences, account section.
- **Returning-user resume** — in-progress banner with progress + Resume.
- **Accounts & sync** — user accounts and cross-device persistence.

The **HOME**, **SAVED**, and **COMPLETED** concepts exist in both MVP and V1; V1
re-introduces the **EXPLORE** and **PROFILE** tabs and the richer behaviors above.

---

## 12. Open Questions (MVP)

- **Park scope:** "all national parks" = the **63 designated National Parks**, or a
  broader set (national monuments, historic sites, recreation areas)?
- **Authoring & QA:** who authors/curates the pre-generated questions, and what's the
  accuracy-review process before ship?
- **Download semantics:** if all content is bundled with the app, what does "download"
  add — is the catalog actually fetched remotely and cached, or is "download" a
  product affordance over already-bundled content?
- **History granularity:** does Completed store **every attempt**, or only the **best
  (or latest) score** per quiz?
- **Recommended order:** what order does the main page use (alphabetical, curated,
  random)? Any lightweight "featured" concept without the full V1 marketplace?
- **Persistence limits:** expected storage budget for downloads and history caps.
