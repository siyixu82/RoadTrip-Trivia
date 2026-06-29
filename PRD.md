# RoadTrip Trivia — Product Requirements Document

_Derived from the exported Claude Design wireframes (`project/RoadTrip Wireframes.html`) and the design chat transcript (`chats/chat1.md`)._

---

## 1. Product Overview

RoadTrip Trivia is a mobile trivia app built for people on road trips. It serves trivia
questions that are tied to where the user is, and it is designed to be **safe and usable
while driving** — questions can be read aloud so the driver can keep their eyes on the road
and simply tap (or listen) to play.

The app has two ways to get a quiz: the user can **type any topic they like**, or **pick a
place** and let the app generate a location-based quiz. Beyond playing, users can browse a
**marketplace of quizzes**, and keep a record of what they've **played and saved**.

### Goals
- Make trivia genuinely playable by a driver without compromising road safety.
- Let users start a quiz in seconds — by topic or by location.
- Give passengers a self-paced, quiet alternative.
- Provide a library to discover new quizzes and revisit past ones.

### Target users
- **Drivers** who want hands-light, eyes-on-road entertainment.
- **Passengers** who want self-paced quizzes.
- **New users** with no history, who should still get relevant suggestions immediately.
- **Returning users** who have an in-progress quiz and play history.

---

## 2. Design Language & Tone

These are product-level look-and-feel requirements, not implementation details.

- **Style:** hand-drawn, friendly "wireframe sketch" aesthetic — rounded corners, dashed
  dividers, a casual handwritten display font paired with a monospace font for small labels.
- **Primary brand color:** warm amber/orange (`#F5A623`), used for the main calls-to-action,
  highlights, and the quiz experience.
- **Supporting colors:** warm cream backgrounds (`#FFF8EC`), off-white canvas (`#f0eee9`),
  warm dark brown (`#2D1A00`) for phone framing, and a dark charcoal (`#1a1a1a` / `#222`)
  panel used for quiz answers and in-progress banners.
- **Feedback colors:** green for correct answers, red for incorrect.
- **Frame:** every screen is presented inside a phone shell (notch, status bar showing
  "9:41", rounded body). Target form factor is a single mobile phone screen (~320×640).
- **No-scroll principle:** core screens (Home, Mode Select) should fit within the phone
  frame **without scrolling**. List-heavy screens (Explore, Saved, Settings, Results) may
  scroll.

---

## 3. Global Navigation

A persistent **bottom navigation bar** appears on the main screens with exactly four tabs:

1. **HOME**
2. **EXPLORE**
3. **SAVED**
4. **PROFILE**

> Note: An earlier "RANKS" tab was explicitly removed. Results are reached by finishing a
> quiz, not via a nav tab.

The active tab is highlighted in amber; inactive tabs are muted gray.

---

## 4. Screens & Requirements

The product comprises **seven screens**.

### 4.1 Home — New User (`1a`)
For a user with no play history; emphasizes onboarding and getting started fast.

Must include:
- **Header:** app name "RoadTrip Trivia" with a map pin glyph, a current-location pill
  (e.g. "📍 SEDONA, AZ"), and a profile avatar icon.
- **Search bar:** a passive "Search quizzes, topics…" field.
- **Generate-a-quiz card** (the primary onboarding affordance) with **two ways to start**:
  1. **Type any topic** — a free-text field with a "Go" action.
  2. **Pick a place** — a location selector (showing the nearby place, e.g. "Sedona, AZ")
     that the user can change, separated from option 1 by an "OR PICK A PLACE" divider.
- **"Recommended For You"** list — quiz suggestions seeded by location even with no history,
  with a subtitle like "Based on your Sedona location" (e.g. Red Rock Flora, Route 66
  History, Arizona Legends).
- Bottom navigation (HOME active).
- Entire screen fits without scrolling.

### 4.2 Home — Returning User (`1b`)
For a user who already has activity. Same structure as new-user home, plus:
- **In-progress banner** at the top: a dark card showing the quiz currently underway
  (e.g. "Grand Canyon Trivia"), a progress bar, and a **Resume** action.
- The same generate-a-quiz card and "Recommended For You" list.
- Bottom navigation (HOME active).
- Fits without scrolling.

### 4.3 Mode Select (`2`)
Shown **after the user taps a quiz, before it starts**. Lets the user choose how they want
to play this ride.

Must include:
- **Back control** and the **quiz title** (e.g. "Grand Canyon Trivia").
- **Quiz meta** summary: number of questions, difficulty, and approximate duration
  (e.g. 10 questions · Medium · ~5m).
- A prompt: "How do you want to play?"
- **Two mode choices:**
  - **Read Aloud** — visually highlighted as the **recommended / driver-safe** default.
    Describes that questions are spoken aloud so the driver keeps eyes on the road and just
    taps. Carries supporting tags (e.g. "Driver safe", "Auto-narrated", "Tap to answer") and
    a primary "Start with Read Aloud" action.
  - **Quiet Mode** — self-paced, no audio, "great for passengers." Secondary styling with a
    "Start Quiet" action.
- Both mode cards fit on screen **without scrolling**.

### 4.4 Explore (`3`)
A marketplace for discovering quizzes.

Must include:
- Title "Explore" with a subtitle ("Discover quizzes for every road trip").
- A **search field** (by topic, place, keyword).
- A horizontally scrollable row of **category chips** (e.g. Parks, Food, Music, History,
  Nature, Route 66); the first/active chip is highlighted.
- A **featured banner** ("Featured This Week") on a dark card with a title, meta line, and a
  "Play Now" action. Editorial pick that rotates weekly.
- An **"All Quizzes" list** of quiz rows, each with a tag/badge (TRENDING, NEW, POPULAR,
  STAFF PICK, etc.), question count, a **save (♡)** control, and a **Play** action.
- Bottom navigation (EXPLORE active).

### 4.5 Saved & History (`4`)
The user's personal library of past and saved quizzes.

Must include:
- Title "Saved & History".
- A **toggle** between two views: **History** and **Saved**.
- **History / "Recently Played"** list: each row shows the quiz, when it was played
  (Today, Yesterday, a date), the **score** earned (e.g. 7/10), and a **Retry** action.
- **Saved Quizzes** list: each row shows the quiz, its question count, a **remove (✕)**
  control, and a **Play** action.
- Bottom navigation (SAVED active).

### 4.6 Quiz / Driver Mode (`5`)
The core gameplay screen, optimized for driving.

Must include:
- **Amber header zone** with: current question position (e.g. "Q 4/10"), the quiz name
  (e.g. "Grand Canyon"), an elapsed **timer**, and a **progress bar**.
- **Question card** (white bubble) containing:
  - A **read-aloud / TTS bar**: a speaker control, an audio **waveform** indicator, and a
    **mute** toggle. The question is auto-read on load; tapping the speaker replays it.
  - The **question text**, large and centered.
- **Answer options** on a dark panel for night/glare comfort. Four large, thumb-friendly
  options (minimum ~56px tap targets), each labeled A–D.
- **Answer feedback (graded state):** when an answer is chosen, the **correct** option turns
  **green with a ✓** and a **wrong** pick turns **red with a ✕**. There are **no Skip or
  Next buttons** — after answering, the quiz **auto-advances** to the next question.
- A **feedback strip** below the options explaining the correct answer
  (e.g. "Correct answer: A — The Grand Canyon is about 1 mile deep…").
- A subtle "Auto-advances to next question…" hint.
- Mute toggle must let the user silence/enable narration at any time.

### 4.7 Results (`6`)
Shown when a quiz is completed.

Must include:
- A celebratory header (trophy, "Quiz Complete!", the quiz name).
- A **score ring** showing the result (e.g. 7/10 correct).
- A **stats row**: time taken, streak, and XP earned.
- A **"Review Answers"** list: each answered question marked correct (✅) or incorrect (❌),
  showing the user's answer and, when wrong, the correct answer. (Wrong rows can expand to a
  full explanation.)
- A **"Play Next"** suggestion set, seeded by current location and history.
- Primary **Play Again** and secondary **Share Score** actions.
- Bottom navigation.

### 4.8 Settings / Profile (`7`)
Account and accessibility preferences.

Must include:
- A **profile card**: avatar, name (e.g. "Road Tripper"), level / XP, and an **Edit** action.
- **Audio & Accessibility** section — central to driver use:
  - Toggle: Read Questions Aloud.
  - Toggle: Auto-Mute on Answer.
  - Setting: Voice Speed (e.g. 1.0× — Normal).
  - Setting: Voice (e.g. "Samantha (US English)").
- **Driver Mode** section: a highlighted card describing the mode (large tap targets,
  auto-read, skip gestures) with a clear on/off control showing current state.
- **Quiz Preferences** section: Location (auto-detect), Default Difficulty, Time Limit per
  Question (toggle), Notifications (toggle).
- **Account** section: My Stats & History, Achievements, Sign Out.
- Bottom navigation (PROFILE active).

---

## 5. Key Flows

1. **Start by topic:** Home → type a topic → Go → Mode Select → Quiz → Results.
2. **Start by location:** Home → pick a place → Mode Select → Quiz → Results.
3. **Resume:** Returning Home → Resume in-progress banner → Quiz.
4. **Discover:** Explore → pick a quiz (or featured) → Mode Select → Quiz → Results.
5. **Replay from library:** Saved & History → Retry (history) or Play (saved) → Mode Select
   → Quiz → Results.
6. **Choose how to play:** any quiz entry point → Mode Select → Read Aloud or Quiet → Quiz.
7. **Play loop:** Quiz auto-advances through all questions → Results → Play Again / Play Next.

---

## 6. Functional Requirements

- **FR-1 — Two-path quiz generation:** Users can start a quiz by typing a free-text topic or
  by selecting a location.
- **FR-2 — Location awareness:** The app surfaces a current/nearby location and seeds
  recommendations from it, even for users with no history. The location is changeable.
- **FR-3 — Mode selection:** Before any quiz starts, the user chooses Read Aloud or Quiet
  mode, with Read Aloud recommended as the driver-safe default.
- **FR-4 — Read-aloud narration:** In Read Aloud mode, questions are spoken automatically;
  the user can replay narration and mute/unmute at any time.
- **FR-5 — Driver-friendly gameplay:** Large tap targets, dark answer panel, no manual
  Next/Skip; the quiz auto-advances after each answer.
- **FR-6 — Immediate answer feedback:** On answering, the correct option shows green/✓ and a
  wrong selection shows red/✕, with an explanation of the correct answer.
- **FR-7 — Scoring & results:** On completion the app shows score, time, streak, XP, a
  per-question review, and next-quiz suggestions.
- **FR-8 — Explore marketplace:** Users can browse, search, filter by category, and play
  quizzes; featured content is highlighted.
- **FR-9 — Save & history:** Users can save quizzes, see recently played quizzes with scores,
  retry past quizzes, and remove saved ones.
- **FR-10 — Accessibility & preferences:** Users can configure narration (voice, speed,
  auto-mute), toggle Driver Mode, and set quiz defaults from Settings.

---

## 7. Out of Scope (for this design)

- Real backend, accounts/auth, or persistence — the wireframes show static example data.
- Real text-to-speech engine integration (the read-aloud UI is represented, not wired to a
  voice engine).
- Real maps/GPS — location is represented at the UI level.
- Multiplayer, leaderboards, or social features (the RANKS tab was intentionally removed).
- Payments / monetization of marketplace quizzes.

---

## 8. Open Questions

- Should Read Aloud vs Quiet be remembered per user as a default, or asked every time?
- How are quizzes authored/sourced for the marketplace, and who curates "Featured This Week"?
- What exactly is the "in-progress" resume state preserving (position, timer, answers)?
- Does Driver Mode (Settings) change behavior beyond what Read Aloud already provides?
