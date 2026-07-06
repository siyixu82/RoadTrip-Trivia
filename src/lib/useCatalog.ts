"use client";

import { useCallback, useEffect, useState } from "react";
import { listQuizzes } from "@/lib/repository/quizRepository";
import type { QuizSummary } from "@/lib/types";

export type CatalogState =
  | { status: "loading" }
  | { status: "ready"; quizzes: QuizSummary[] }
  | { status: "error"; message: string };

export interface CatalogHook {
  state: CatalogState;
  /** Re-run the catalog fetch (e.g. from a "Try again" button after a failure). */
  reload: () => void;
}

/** Loads the full quiz catalog (metadata only) from the repository. */
export function useCatalog(): CatalogHook {
  const [state, setState] = useState<CatalogState>({ status: "loading" });
  // Bumping this re-runs the effect, giving callers an explicit retry.
  const [attempt, setAttempt] = useState(0);

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
  }, [attempt]);

  // Reset to loading here (in the event handler, not the effect) so a retry
  // shows the skeleton immediately, then re-runs the fetch via the attempt bump.
  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, reload };
}
