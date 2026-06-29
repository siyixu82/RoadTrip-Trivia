"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getQuizBySlug } from "@/lib/repository/quizRepository";
import { QuizPlayer } from "@/components/QuizPlayer";
import type { Quiz } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; quiz: Quiz }
  | { status: "notfound" }
  | { status: "error"; message: string };

export default function QuizPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const quiz = await getQuizBySlug(slug);
        if (cancelled) return;
        setState(quiz ? { status: "ready", quiz } : { status: "notfound" });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Failed to load quiz",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === "ready") return <QuizPlayer quiz={state.quiz} />;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center text-zinc-500">
      {state.status === "loading" && <p>Loading quiz…</p>}
      {state.status === "notfound" && (
        <>
          <p>Quiz not found.</p>
          <Link href="/" className="text-[#F5A623] underline">
            Back home
          </Link>
        </>
      )}
      {state.status === "error" && (
        <>
          <p>Couldn&apos;t load this quiz.</p>
          <p className="text-sm">{state.message}</p>
          <Link href="/" className="text-[#F5A623] underline">
            Back home
          </Link>
        </>
      )}
    </div>
  );
}
