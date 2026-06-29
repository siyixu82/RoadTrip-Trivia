"use client";

import Link from "next/link";
import { toggleSave, useIsSaved } from "@/lib/library/library";
import type { QuizSummary } from "@/lib/types";

/**
 * Catalog card used on Home and Explore: park name, question count, a Save
 * heart, and Play. The heart reflects/toggles the local library.
 */
export function QuizCard({ quiz }: { quiz: QuizSummary }) {
  const saved = useIsSaved(quiz.id);

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#1a1a1a]/15 bg-white/50 p-4">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-semibold">{quiz.title}</span>
        <span className="text-sm text-[#1a1a1a]/50">
          {quiz.question_count} questions
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => toggleSave(quiz)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save quiz"}
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg transition-colors ${
            saved
              ? "border-[#F5A623] bg-[#F5A623] text-white"
              : "border-[#1a1a1a]/15 text-[#1a1a1a]/50 hover:border-[#F5A623] hover:text-[#F5A623]"
          }`}
        >
          {saved ? "♥" : "♡"}
        </button>
        {quiz.slug && (
          <Link
            href={`/quiz/${quiz.slug}`}
            className="rounded-full bg-[#F5A623] px-5 py-2 font-medium text-black transition-opacity hover:opacity-90"
          >
            Play
          </Link>
        )}
      </div>
    </li>
  );
}
