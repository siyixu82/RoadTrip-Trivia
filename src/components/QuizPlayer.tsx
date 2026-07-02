"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordCompletion } from "@/lib/library/library";
import { parkIcon, parkName } from "@/lib/parkIcon";
import type { Quiz } from "@/lib/types";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
// Pause after answering so the correct/incorrect feedback is readable before we
// auto-advance. The user can also move with the Back/Next buttons, which cancel
// this timer (so reviewing a past question never yanks them forward).
const ADVANCE_DELAY_MS = 2500;

// In-progress quiz state is persisted per quiz so it survives an iOS PWA resume
// (which reloads the web view and would otherwise drop React state). We use
// sessionStorage on purpose: it outlives a background/resume reload but is
// cleared when the app is terminated — matching the "cold launch → Home"
// behavior, so a finished-with-the-app session doesn't restore stale progress.
const PROGRESS_PREFIX = "rtt-quiz-progress:";

type Progress = {
  answers: (number | null)[];
  currentIndex: number;
  finished: boolean;
};

function loadProgress(quizId: string, total: number): Progress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PROGRESS_PREFIX + quizId);
    if (!raw) return null;
    const p = JSON.parse(raw) as Progress;
    // Guard against stale/corrupt data (e.g. the quiz changed length).
    if (!Array.isArray(p.answers) || p.answers.length !== total) return null;
    return {
      answers: p.answers,
      currentIndex: Math.min(Math.max(0, p.currentIndex ?? 0), total - 1),
      finished: !!p.finished,
    };
  } catch {
    return null;
  }
}

function saveProgress(quizId: string, p: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PROGRESS_PREFIX + quizId, JSON.stringify(p));
  } catch {
    // Storage full / disabled — progress persistence is best-effort.
  }
}

type Props = { quiz: Quiz };

export function QuizPlayer({ quiz }: Props) {
  const questions = quiz.questions;
  const total = questions.length;

  // Rehydrate any in-progress attempt (QuizPlayer mounts client-side only —
  // the route shows "Loading…" during SSR — so reading storage here is safe).
  const [currentIndex, setCurrentIndex] = useState(
    () => loadProgress(quiz.id, total)?.currentIndex ?? 0,
  );
  // One slot per question, so answers are remembered when navigating back/forth.
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => loadProgress(quiz.id, total)?.answers ?? Array(total).fill(null),
  );
  const [finished, setFinished] = useState(
    () => loadProgress(quiz.id, total)?.finished ?? false,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist progress whenever it changes so a resume restores the exact state.
  useEffect(() => {
    saveProgress(quiz.id, { answers, currentIndex, finished });
  }, [quiz.id, answers, currentIndex, finished]);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Clean up any pending auto-advance on unmount.
  useEffect(() => clearTimer, [clearTimer]);

  const scoreOf = useCallback(
    (arr: (number | null)[]) =>
      arr.reduce<number>(
        (n, a, i) => (a === questions[i].correct_index ? n + 1 : n),
        0,
      ),
    [questions],
  );

  const finish = useCallback(
    (finalAnswers: (number | null)[]) => {
      clearTimer();
      setFinished(true);
      // Record the attempt to the local library (repo layer hides Supabase vs
      // IndexedDB); the call site is unchanged from Phase 4.
      recordCompletion({
        quizId: quiz.id,
        slug: quiz.slug,
        title: quiz.title,
        score: scoreOf(finalAnswers),
        questionCount: total,
      });
    },
    [clearTimer, quiz, scoreOf, total],
  );

  const goNext = useCallback(() => {
    clearTimer();
    if (currentIndex + 1 < total) {
      setCurrentIndex((i) => i + 1);
    } else {
      finish(answers);
    }
  }, [answers, clearTimer, currentIndex, finish, total]);

  const goBack = useCallback(() => {
    clearTimer();
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, [clearTimer]);

  const handleSelect = (optionIndex: number) => {
    if (answers[currentIndex] !== null) return; // locked once answered

    const next = answers.slice();
    next[currentIndex] = optionIndex;
    setAnswers(next);

    timer.current = setTimeout(() => {
      if (currentIndex + 1 < total) {
        setCurrentIndex((i) => i + 1);
      } else {
        finish(next);
      }
    }, ADVANCE_DELAY_MS);
  };

  const handleRetry = () => {
    clearTimer();
    setCurrentIndex(0);
    setAnswers(Array(total).fill(null));
    setFinished(false);
  };

  if (finished) {
    const score = scoreOf(answers);
    const pct = Math.round((score / total) * 100);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#FFF8EC] p-6 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl" aria-hidden>
            🏆
          </span>
          <h1 className="text-2xl font-bold">Quiz complete!</h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#1a1a1a]/45">
            {quiz.title}
          </p>
        </div>

        {/* Score ring */}
        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-[6px] border-[#F5A623] shadow-[0_0_0_3px_#FFF8EC,0_0_0_5px_#F5A623]">
          <span className="text-3xl font-bold text-[#1a1a1a]">
            {score}/{total}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-[#1a1a1a]/45">
            correct
          </span>
        </div>
        <p className="text-sm text-[#1a1a1a]/50">{pct}% correct</p>

        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="rounded-full border-2 border-[#1a1a1a] bg-[#F5A623] px-7 py-2.5 font-bold text-[#1a1a1a] transition-opacity hover:opacity-90"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-full border-2 border-[#1a1a1a]/15 bg-white px-7 py-2.5 font-bold transition-colors hover:border-[#1a1a1a]/30"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const selectedIndex = answers[currentIndex];
  const answered = selectedIndex !== null;
  const isLast = currentIndex + 1 >= total;
  const progress = ((currentIndex + (answered ? 1 : 0)) / total) * 100;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col bg-[#F5A623]">
      {/* Amber header zone: home · position · quiz name · progress */}
      <div className="flex flex-col gap-3 px-4 pt-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl bg-black/15 px-3 py-1.5 font-bold text-[#1a1a1a] transition-opacity hover:opacity-80"
            >
              Home
            </Link>
            <span className="rounded-xl bg-black/15 px-3 py-1.5 font-mono text-sm font-bold text-[#1a1a1a]">
              Q {currentIndex + 1}/{total}
            </span>
          </div>
          <span className="flex min-w-0 items-center gap-1.5 truncate rounded-full bg-white/40 px-4 py-1.5 text-sm font-bold text-[#1a1a1a]">
            <span aria-hidden>{parkIcon(quiz.slug)}</span>
            <span className="truncate">{parkName(quiz.title)}</span>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/15">
          <div
            className="h-full rounded-full bg-[#1a1a1a] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card — white bubble */}
      <div className="mx-4 mb-3 rounded-3xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
        <h2 className="text-center text-lg font-bold leading-snug text-[#1a1a1a]">
          {question.prompt}
        </h2>
      </div>

      {/* Answer options on a cream panel (matches the app background) */}
      <div className="flex flex-1 flex-col gap-2.5 rounded-t-3xl bg-[#FFF8EC] px-3.5 pt-4 pb-4">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correct_index;
          const isPicked = i === selectedIndex;

          let stateClasses =
            "bg-white border-[#1a1a1a]/12 text-[#1a1a1a] shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#F5A623]";
          let badgeClasses = "bg-[#1a1a1a]/8 text-[#1a1a1a]/60";
          let mark: string | null = null;
          if (answered) {
            if (isCorrect) {
              stateClasses = "bg-green-600 border-green-500 text-white";
              badgeClasses = "bg-white/25 text-white";
              mark = "✓";
            } else if (isPicked) {
              stateClasses = "bg-red-600 border-red-500 text-white";
              badgeClasses = "bg-white/25 text-white";
              mark = "✕";
            } else {
              stateClasses =
                "bg-[#1a1a1a]/[0.04] border-[#1a1a1a]/8 text-[#1a1a1a]/40";
            }
          }

          return (
            <button
              key={i}
              data-testid="option"
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`flex min-h-[52px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${stateClasses} ${
                answered ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeClasses}`}
              >
                {OPTION_LETTERS[i]}
              </span>
              <span className="flex-1 text-[15px] font-medium">{option}</span>
              {mark && <span className="text-lg font-bold">{mark}</span>}
            </button>
          );
        })}

        {/* Manual navigation — Back/Next let you review answers at your own pace */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <button
            onClick={goBack}
            disabled={currentIndex === 0}
            className="rounded-full border-2 border-[#1a1a1a]/15 bg-white px-5 py-2 font-bold text-[#1a1a1a] transition-colors hover:border-[#1a1a1a]/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Back
          </button>
          {answered ? (
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/35">
              {isLast ? "Tap finish" : "Auto-advancing…"}
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/25">
              Pick an answer
            </span>
          )}
          <button
            onClick={goNext}
            disabled={!answered}
            className="rounded-full border-2 border-[#1a1a1a] bg-[#F5A623] px-6 py-2 font-bold text-[#1a1a1a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLast ? "Finish" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
