"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordCompletion } from "@/lib/library/library";
import { parkIcon, parkName } from "@/lib/parkIcon";
import type { Quiz } from "@/lib/types";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const ADVANCE_DELAY_MS = 1100; // brief pause to show correct/incorrect before next

type Props = { quiz: Quiz };

export function QuizPlayer({ quiz }: Props) {
  const questions = quiz.questions;
  const total = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Clean up any pending auto-advance on unmount.
  useEffect(() => clearTimer, [clearTimer]);

  const handleSelect = (optionIndex: number) => {
    if (selectedIndex !== null) return; // already answered this question

    setSelectedIndex(optionIndex);
    const correct = optionIndex === questions[currentIndex].correct_index;
    const nextScore = correct ? score + 1 : score;
    if (correct) setScore(nextScore);

    timer.current = setTimeout(() => {
      if (currentIndex + 1 < total) {
        setCurrentIndex((i) => i + 1);
        setSelectedIndex(null);
      } else {
        setFinished(true);
        // Phase 4: record the attempt to the local library (localStorage).
        // Phase 5 swaps this for Supabase `history` once auth provides a
        // user_id for RLS — the call site stays the same.
        recordCompletion({
          quizId: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          score: nextScore,
          questionCount: total,
        });
      }
    }, ADVANCE_DELAY_MS);
  };

  const handleRetry = () => {
    clearTimer();
    setCurrentIndex(0);
    setSelectedIndex(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
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
  const answered = selectedIndex !== null;
  const progress = ((currentIndex + (answered ? 1 : 0)) / total) * 100;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col bg-[#F5A623]">
      {/* Amber header zone: position · quiz name · progress */}
      <div className="flex flex-col gap-3 px-4 pt-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-xl bg-black/15 px-3 py-1.5 font-mono text-sm font-bold text-[#1a1a1a]">
            Q {currentIndex + 1}/{total}
          </span>
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

      {/* Answer options on a light panel */}
      <div className="flex flex-1 flex-col gap-2.5 rounded-t-3xl bg-white px-3.5 pt-4 pb-4">
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

        {answered && (
          <p className="pt-2 text-center font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/35">
            Auto-advances to next question…
          </p>
        )}
      </div>
    </div>
  );
}
