"use client";

import Link from "next/link";
import { QuizCard } from "@/components/QuizCard";
import { useCatalog } from "@/lib/useCatalog";

// MVP Home draws "recommended" from the full park catalog (see PRD open
// question). We surface a small curated-feeling slice and point to Explore for
// the rest, so Home reads differently from the full catalog list.
const RECOMMENDED_COUNT = 6;

export default function Home() {
  const state = useCatalog();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">RoadTrip Trivia</h1>
        <p className="text-[#1a1a1a]/50">Recommended for your next trip.</p>
      </header>

      {state.status === "error" && (
        <p className="text-red-600">Error: {state.message}</p>
      )}
      {state.status === "loading" && (
        <p className="text-[#1a1a1a]/50">Loading…</p>
      )}

      {state.status === "ready" && (
        <>
          <ul className="flex flex-col gap-3">
            {state.quizzes.slice(0, RECOMMENDED_COUNT).map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </ul>
          {state.quizzes.length > RECOMMENDED_COUNT && (
            <Link
              href="/explore"
              className="self-center rounded-full border-2 border-[#1a1a1a]/15 px-6 py-2.5 font-medium transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
            >
              Explore all {state.quizzes.length} parks →
            </Link>
          )}
        </>
      )}
    </main>
  );
}
