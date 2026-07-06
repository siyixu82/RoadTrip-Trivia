"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QuizCard } from "@/components/QuizCard";
import { CatalogError, CatalogSkeleton } from "@/components/CatalogState";
import { useCatalog } from "@/lib/useCatalog";
import { getAllCachedQuizzes, getAllProgress, type ProgressRow } from "@/lib/db/idb";
import { parkIcon, parkName } from "@/lib/parkIcon";
import type { QuizSummary } from "@/lib/types";

// MVP Home draws "recommended" from the full park catalog (see PRD open
// question). We surface a small curated-feeling slice and point to Explore for
// the rest, so Home reads differently from the full catalog list.
const RECOMMENDED_COUNT = 6;

/** Latest unfinished attempt (for the Resume card), loaded from the durable cache. */
function useResume(): ProgressRow | null {
  const [resume, setResume] = useState<ProgressRow | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAllProgress()
      .then((rows) => {
        if (cancelled) return;
        const latest =
          rows
            .filter((r) => r.slug && r.answers.some((a) => a !== null))
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;
        setResume(latest);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return resume;
}

/** Quizzes whose questions are cached locally → playable offline. */
function useOfflineQuizzes(): QuizSummary[] {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  useEffect(() => {
    let cancelled = false;
    getAllCachedQuizzes()
      .then((rows) => {
        if (cancelled) return;
        setQuizzes(
          rows
            .filter((q) => q.questions && q.questions.length > 0)
            .map((q) => ({
              id: q.id,
              slug: q.slug,
              title: q.title,
              question_count: q.question_count,
              difficulty: q.difficulty,
            })),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return quizzes;
}

export default function Home() {
  const { state, reload } = useCatalog();
  const resume = useResume();
  const offlineQuizzes = useOfflineQuizzes();

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

      {resume && <ResumeCard resume={resume} />}

      {state.status === "ready" ? (
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
      ) : state.status === "loading" ? (
        <>
          <div>
            <h2 className="text-lg font-bold">Recommended for you</h2>
            <p className="text-sm text-[#1a1a1a]/45">
              Hand-picked parks to quiz on your next trip.
            </p>
          </div>
          <CatalogSkeleton count={RECOMMENDED_COUNT} />
        </>
      ) : offlineQuizzes.length > 0 ? (
        // Catalog failed (typically offline): the full catalog needs a network,
        // so fall back to quizzes already downloaded to this device instead of
        // showing an error over content the user can actually play.
        <>
          <div>
            <h2 className="text-lg font-bold">Downloaded quizzes</h2>
            <p className="text-sm text-[#1a1a1a]/45">
              Available offline on this device.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {offlineQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </ul>
        </>
      ) : (
        <CatalogError message={state.message} onRetry={reload} />
      )}
    </main>
  );
}

function ResumeCard({ resume }: { resume: ProgressRow }) {
  const answered = resume.answers.filter((a) => a !== null).length;
  const pct = Math.round((answered / resume.question_count) * 100);
  return (
    <Link
      href={`/quiz/${resume.slug}`}
      className="flex flex-col gap-2.5 rounded-2xl border-2 border-[#F5A623] bg-[#FFF8EC] p-4 shadow-[0_2px_10px_rgba(245,166,35,0.15)] transition-colors hover:bg-[#fdf1da]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#F5A623]/60 bg-white text-xl">
          {parkIcon(resume.slug)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#F5A623]">
            ▶ Resume quiz
          </div>
          <div className="line-clamp-1 text-[15px] font-bold leading-tight text-[#1a1a1a]">
            {parkName(resume.title)}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wide text-[#1a1a1a]/45">
            Question {Math.min(resume.current_index + 1, resume.question_count)} of{" "}
            {resume.question_count}
          </div>
        </div>
        <span className="rounded-full border-2 border-[#1a1a1a] bg-[#F5A623] px-4 py-1.5 text-sm font-bold text-[#1a1a1a]">
          Resume
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]/10">
        <div
          className="h-full rounded-full bg-[#F5A623] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
