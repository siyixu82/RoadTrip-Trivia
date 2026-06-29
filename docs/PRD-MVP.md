# RoadTrip Trivia — MVP Product Requirements Document

> **Status: Draft — open for review.** Comment inline on any line; open questions are in §9.
>
> **Scope:** This is the **MVP**. Every other feature from the original spec lives in
> [`PRD-V1.md`](PRD-V1.md).

---

## 1. Overview

RoadTrip Trivia is a **mobile-first web app** (deployed on **Vercel**) that serves
place-based trivia to **travelers** — road trips, flights, and travel in general. The
MVP ships a focused, mostly static product: a library of **pre-generated quizzes for
the U.S. National Parks**, a **20-question** play experience, and lightweight personal
organization — **saved/downloaded** quizzes for offline use and a **history of
completed quizzes with scores**.

There is no AI generation, location/GPS, read-aloud, or marketplace in the MVP — those
are V1. The goal is to validate the core loop: a traveler picks a park quiz, plays it
through, and comes back.

**Goals**
- Ship a complete, playable trivia experience with no backend AI dependency.
- Take a user from open → pick a quiz → finish 20 questions in one sitting.
- Make quizzes usable **offline** (planes, remote areas, no data abroad).
- Keep a simple record of **completed** quizzes (with scores) and **saved** ones.

**Users:** travelers who want a quick, self-paced quiz tied to where they're going — on
any trip, not just in a car. No accounts; personalization is limited to the device's
own saved/completed data.

---

## 2. Scope at a Glance

**In (MVP):** (1) pre-generated National Park quizzes, 20 Q each · (2) Home of
recommended quizzes · (3) Explore to browse/search the catalog · (4) play & complete a
quiz · (5) a Saved tab combining saved/downloaded quizzes with completed history.

**Out (→ V1):** AI/topic generation, location awareness & GPS, Read-Aloud / Driver
Mode, the full Explore *marketplace* (categories, featured, badges), gamified results
(XP/streak/share/next-up), Settings/Profile, resume-in-progress, accounts/cloud sync,
multiplayer, payments. See [`PRD-V1.md`](PRD-V1.md).

---

## 3. Design & Platform

- **Platform:** mobile-first responsive **web app** deployed on **Vercel**, built as a
  **PWA** so quizzes can be cached for offline play.
- **Persistence:** browser-local only (IndexedDB/localStorage) — no accounts, no sync.
- **Look & feel:** hand-drawn "wireframe sketch" aesthetic; warm amber (`#F5A623`)
  primary, cream (`#FFF8EC`) backgrounds, dark (`#1a1a1a`) answer panels; green/red
  answer feedback. (Full design language in [`PRD-V1.md`](PRD-V1.md) §2.)

---

## 4. Navigation

Three-tab bottom nav: **HOME** (recommended) · **EXPLORE** (browse/search) · **SAVED**
(saved/downloaded quizzes + completed history). The Quiz screen is reached by selecting
a quiz and hides the nav while playing.

---

## 5. Features & Screens

### 5.1 Quiz content
Pre-generated (human-curated), static quizzes bundled with the app — **one per U.S.
National Park** (63 as of 2026; exact scope is an open question). Each quiz is
**exactly 20** single-answer **multiple-choice** questions (four options, A–D, one
correct), covering the park's geography, wildlife, history, and landmarks. No AI
generation.

### 5.2 Home — Recommended
A scrollable list of **recommended** quiz cards (in MVP, drawn from the full park
catalog). Each card shows the park name, "20 questions", a **Save (♡)**, and **Play**.

### 5.3 Explore — Browse & Search
The full park-quiz catalog with **search/filter** by park name or state; same quiz
cards (Save + Play). The richer marketplace — categories, featured banner, badges — is
V1.

### 5.4 Quiz
- **Header:** position (e.g. "Q 4/20"), quiz name, progress bar.
- **Question:** text plus four large A–D options.
- **Feedback:** on answer, the correct option turns **green ✓** and a wrong pick
  **red ✕**; tap **Next** to continue.
- **Completion:** after Q20 a summary shows the **score (X/20)** with **Retry** and
  **Home**; the attempt is recorded to History.

### 5.5 Saved — Library & History
One tab with a toggle between two views:
- **Saved:** bookmarked quizzes, each with **Play**, **Download** (for offline), and
  **remove (✕)**; downloaded quizzes show a **Downloaded ✓** state and play with no
  connection.
- **History:** completed quizzes with **date**, **score (X/20)**, and **Retry**.

Both views persist in browser-local storage.

---

## 6. Functional Requirements

- **MFR-1** Ship static, pre-authored quizzes for all U.S. National Parks, 20 MCQs each.
- **MFR-2** Home presents recommended quizzes; Explore browses/searches the full catalog.
- **MFR-3** Users can play a quiz with immediate correct/incorrect feedback and reach a
  final score.
- **MFR-4** Completing a quiz records it (date + score) in History under the Saved tab;
  supports retry.
- **MFR-5** Users can save quizzes and download them for **offline** play (PWA caching);
  saves and downloads are removable.
- **MFR-6** Saved, downloaded, and completed data persist in browser-local storage — no
  account or sync.

---

## 7. Key Flows

1. **Play:** Home/Explore → Play → 20 questions → score → recorded in History.
2. **Save & download:** Save (♡) → Saved tab → Download → playable offline.
3. **Offline:** no connection → Saved → Play a downloaded quiz → score.
4. **Review/replay:** Saved → History → Retry.

---

## 8. Out of Scope (MVP)

AI/topic generation · location & GPS · Read-Aloud / Driver Mode · the full Explore
marketplace · gamified results (XP/streak/share/next-up) · Settings/Profile ·
resume-in-progress · accounts/auth/cloud sync · multiplayer · payments. All planned for
V1 ([`PRD-V1.md`](PRD-V1.md)).

---

## 9. Open Questions

- **Park scope:** the 63 designated National Parks, or a broader set (monuments,
  historic sites)?
- **Authoring/QA:** who writes and fact-checks the questions?
- **Download semantics:** with content bundled, is "download" PWA service-worker
  caching of an otherwise-online catalog, or an affordance over already-bundled content?
- **History granularity:** store every attempt, or only the best/latest score per quiz?
- **Home vs Explore:** should Home recommend a curated subset rather than mirror the
  full catalog Explore shows?
