"use client";

import Link from "next/link";
import { toggleSave, useIsSaved } from "@/lib/library/library";
import { parkIcon, parkName } from "@/lib/parkIcon";
import type { QuizSummary } from "@/lib/types";

/**
 * Catalog card used on Home and Explore. Cream icon tile · Space Mono tag
 * (difficulty • question count) · bold title · Save heart · amber Play pill.
 */
export function QuizCard({ quiz }: { quiz: QuizSummary }) {
  const saved = useIsSaved(quiz.id);
  const tag = (quiz.difficulty ?? "quiz").toUpperCase();

  return (
    <li className="flex items-center gap-3 rounded-2xl border-2 border-[#1a1a1a]/8 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#F5A623]/60 bg-[#FFF8EC] text-2xl">
        {parkIcon(quiz.slug)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#F5A623]">
          {tag} · {quiz.question_count} QS
        </div>
        <div className="line-clamp-2 text-[15px] font-bold leading-tight text-[#1a1a1a]">
          {parkName(quiz.title)}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => toggleSave(quiz)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save quiz"}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg transition-colors ${
            saved
              ? "border-[#F5A623] bg-[#F5A623] text-white"
              : "border-[#1a1a1a]/15 text-[#1a1a1a]/40 hover:border-[#F5A623] hover:text-[#F5A623]"
          }`}
        >
          {saved ? "♥" : "♡"}
        </button>
        {quiz.slug && (
          <Link
            href={`/quiz/${quiz.slug}`}
            className="rounded-full border-2 border-[#F5A623] bg-[#FFF8EC] px-4 py-1.5 text-sm font-bold text-[#F5A623] transition-colors hover:bg-[#F5A623] hover:text-white"
          >
            Play
          </Link>
        )}
      </div>
    </li>
  );
}
