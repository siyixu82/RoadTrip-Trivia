import type { CachedQuiz, HistoryRow, SaveRow } from "@/lib/db/idb";

/**
 * Real offline-download state for a saved quiz:
 * - "none":        not marked for offline.
 * - "downloading": content fetch in flight.
 * - "ready":       questions are cached locally → playable offline.
 * - "error":       marked for offline but content isn't cached (fetch never
 *                  finished / failed / synced from another device) → needs retry.
 */
export type DownloadStatus = "none" | "downloading" | "ready" | "error";

/** A bookmarked quiz as the UI renders it (saves row joined with quiz meta). */
export interface SavedQuiz {
  id: string;
  slug: string | null;
  title: string;
  question_count: number;
  is_offline: boolean;
  download_status: DownloadStatus;
  saved_at: string;
}

/** One completed attempt as the UI renders it (history row joined with meta). */
export interface HistoryEntry {
  id: string;
  quiz_id: string;
  slug: string | null;
  title: string;
  score: number;
  question_count: number;
  completed_at: string;
}

/** Join saves rows with cached quiz metadata; newest first. */
export function buildSaved(
  rows: SaveRow[],
  meta: Map<string, CachedQuiz>,
  downloading: ReadonlySet<string> = new Set(),
): SavedQuiz[] {
  return rows
    .map((r) => {
      const m = meta.get(r.quiz_id);
      const hasContent = !!m?.questions && m.questions.length > 0;
      let download_status: DownloadStatus;
      if (!r.is_offline) download_status = "none";
      else if (hasContent) download_status = "ready";
      else if (downloading.has(r.quiz_id)) download_status = "downloading";
      else download_status = "error";
      return {
        id: r.quiz_id,
        slug: m?.slug ?? null,
        title: m?.title ?? "Quiz",
        question_count: m?.question_count ?? 20,
        is_offline: r.is_offline,
        download_status,
        saved_at: r.saved_at,
      };
    })
    .sort((a, b) => b.saved_at.localeCompare(a.saved_at));
}

/** Join history rows with cached quiz metadata; newest first. */
export function buildHistory(
  rows: HistoryRow[],
  meta: Map<string, CachedQuiz>,
): HistoryEntry[] {
  return rows
    .map((r) => {
      const m = meta.get(r.quiz_id);
      return {
        id: r.id,
        quiz_id: r.quiz_id,
        slug: m?.slug ?? null,
        title: m?.title ?? "Quiz",
        score: r.score,
        question_count: r.question_count,
        completed_at: r.completed_at,
      };
    })
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}
