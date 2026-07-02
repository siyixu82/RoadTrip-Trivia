"use client";

import { useMemo, useState } from "react";
import { QuizCard } from "@/components/QuizCard";
import { useCatalog } from "@/lib/useCatalog";

export default function ExplorePage() {
  const state = useCatalog();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (state.status !== "ready") return [];
    const q = query.trim().toLowerCase();
    if (!q) return state.quizzes;
    return state.quizzes.filter((quiz) => quiz.title.toLowerCase().includes(q));
  }, [state, query]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <span aria-hidden>🧭</span> Explore
        </h1>
        <p className="text-sm text-[#1a1a1a]/45">
          Browse every national-park quiz.
        </p>
      </header>

      <div className="flex items-center gap-2 rounded-full border-2 border-[#1a1a1a]/10 bg-white px-4 py-2.5 focus-within:border-[#F5A623]">
        <span aria-hidden className="text-[#1a1a1a]/40">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by park name…"
          aria-label="Search quizzes by park name"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#1a1a1a]/40"
        />
      </div>

      {state.status === "error" && (
        <p className="text-red-600">Error: {state.message}</p>
      )}
      {state.status === "loading" && (
        <p className="text-[#1a1a1a]/45">Loading…</p>
      )}

      {state.status === "ready" && (
        <>
          <p className="font-mono text-[11px] uppercase tracking-wide text-[#1a1a1a]/40">
            {results.length} {results.length === 1 ? "quiz" : "quizzes"}
          </p>
          {results.length === 0 ? (
            <p className="text-[#1a1a1a]/45">No parks match “{query}”.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {results.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
