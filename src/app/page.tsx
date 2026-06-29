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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 p-5">
      {/* Brand header */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span aria-hidden>🗺️</span> RoadTrip Trivia
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-wide text-[#1a1a1a]/45">
            Trivia for the open road
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#F5A623] bg-[#FFF8EC] text-lg">
          🧭
        </div>
      </header>

      {/* Passive search → Explore */}
      <Link
        href="/explore"
        className="flex items-center gap-2 rounded-full border-2 border-[#1a1a1a]/10 bg-white px-4 py-2.5 text-[#1a1a1a]/40 transition-colors hover:border-[#F5A623]"
      >
        <span aria-hidden>🔍</span>
        <span className="text-sm">Search parks &amp; quizzes…</span>
      </Link>

      {state.status === "error" && (
        <p className="text-red-600">Error: {state.message}</p>
      )}
      {state.status === "loading" && (
        <p className="text-[#1a1a1a]/45">Loading…</p>
      )}

      {state.status === "ready" && (
        <>
          <div>
            <h2 className="text-lg font-bold">Recommended for you</h2>
            <p className="text-sm text-[#1a1a1a]/45">
              Hand-picked parks to quiz on your next trip.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {state.quizzes.slice(0, RECOMMENDED_COUNT).map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </ul>

          {state.quizzes.length > RECOMMENDED_COUNT && (
            <Link
              href="/explore"
              className="self-center rounded-full border-2 border-[#1a1a1a]/12 bg-white px-6 py-2.5 font-bold transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
            >
              Explore all {state.quizzes.length} parks →
            </Link>
          )}
        </>
      )}
    </main>
  );
}
