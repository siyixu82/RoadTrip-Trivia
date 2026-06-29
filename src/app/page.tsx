"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listQuizzes } from "@/lib/repository/quizRepository";
import type { QuizSummary } from "@/lib/types";

export default function Home() {
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listQuizzes()
      .then((q) => !cancelled && setQuizzes(q))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof Error ? e.message : "Failed to load quizzes"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">RoadTrip Trivia</h1>
        <p className="text-zinc-500">Pick a quiz and play.</p>
      </header>

      {error && <p className="text-red-600">Error: {error}</p>}
      {!error && quizzes === null && <p className="text-zinc-500">Loading…</p>}
      {!error && quizzes?.length === 0 && (
        <p className="text-zinc-500">No quizzes yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {quizzes?.map((quiz) => (
          <li
            key={quiz.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <div className="flex flex-col">
              <span className="font-semibold">{quiz.title}</span>
              <span className="text-sm text-zinc-500">
                {quiz.question_count} questions
              </span>
            </div>
            {quiz.slug && (
              <Link
                href={`/quiz/${quiz.slug}`}
                className="rounded-full bg-[#F5A623] px-5 py-2 font-medium text-black transition-opacity hover:opacity-90"
              >
                Play
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
