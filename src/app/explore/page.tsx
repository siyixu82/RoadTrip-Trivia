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
    return state.quizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(q),
    );
  }, [state, query]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
        <p className="text-[#1a1a1a]/50">Browse every park quiz.</p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by park name…"
        aria-label="Search quizzes by park name"
        className="w-full rounded-full border-2 border-[#1a1a1a]/15 bg-white/50 px-5 py-3 outline-none transition-colors focus:border-[#F5A623]"
      />

      {state.status === "error" && (
        <p className="text-red-600">Error: {state.message}</p>
      )}
      {state.status === "loading" && (
        <p className="text-[#1a1a1a]/50">Loading…</p>
      )}

      {state.status === "ready" &&
        (results.length === 0 ? (
          <p className="text-[#1a1a1a]/50">No parks match “{query}”.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {results.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </ul>
        ))}
    </main>
  );
}
