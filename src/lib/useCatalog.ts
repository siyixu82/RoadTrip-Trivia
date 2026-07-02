"use client";

import { useEffect, useState } from "react";
import { listQuizzes } from "@/lib/repository/quizRepository";
import type { QuizSummary } from "@/lib/types";

type CatalogState =
  | { status: "loading" }
  | { status: "ready"; quizzes: QuizSummary[] }
  | { status: "error"; message: string };

/** Loads the full quiz catalog (metadata only) from the repository. */
export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    listQuizzes()
      .then((quizzes) => !cancelled && setState({ status: "ready", quizzes }))
      .catch(
        (e) =>
          !cancelled &&
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Failed to load quizzes",
          }),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
