"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordCompletion } from "@/lib/library/library";
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
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-sm uppercase tracking-widest text-zinc-500">
          {quiz.title}
        </p>
        <h1 className="text-2xl font-semibold">Quiz complete!</h1>
        <div className="flex flex-col items-center gap-1">
          <span className="text-6xl font-bold text-[#F5A623]">
            {score}/{total}
          </span>
          <span className="text-zinc-500">{pct}% correct</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="rounded-full bg-[#F5A623] px-6 py-3 font-medium text-black transition-opacity hover:opacity-90"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-6 py-3 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
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
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-6">
      {/* Header: position + progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span className="font-mono">
            Q {currentIndex + 1}/{total}
          </span>
          <span className="truncate pl-3">{quiz.title}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div
            className="h-full rounded-full bg-[#F5A623] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl font-semibold leading-snug">{question.prompt}</h2>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correct_index;
          const isPicked = i === selectedIndex;

          let stateClasses =
            "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]";
          if (answered) {
            if (isCorrect) {
              stateClasses = "bg-green-600 text-white";
            } else if (isPicked) {
              stateClasses = "bg-red-600 text-white";
            } else {
              stateClasses = "bg-[#1a1a1a] text-white opacity-50";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors ${stateClasses} ${
                answered ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
                {OPTION_LETTERS[i]}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
