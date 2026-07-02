import { getSupabaseClient } from "@/lib/supabase/client";
import {
  getQuizBySlugFromCache,
  putQuiz,
  type CachedQuiz,
} from "@/lib/db/idb";
import type { Quiz, QuizSummary } from "@/lib/types";

/**
 * Data access for quizzes. The UI talks only to this repository, never to
 * Supabase directly — so the offline/IndexedDB layer (Phase 5) can slot in
 * here without touching components.
 *
 * For now everything reads from Supabase (the public catalog, anon-readable).
 */

/** List the catalog (metadata only; no questions payload). */
export async function listQuizzes(): Promise<QuizSummary[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, slug, title, question_count, difficulty")
    .order("title");

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch one quiz (with its questions) by slug, or null if not found.
 *
 * Cache-first: if the quiz's content is already cached (i.e. downloaded or
 * previously played), return it immediately and revalidate in the background.
 * Quiz content is effectively immutable, so this is safe — and it makes offline
 * opens instant. (Network-first previously hung ~10s on a doomed request before
 * falling back to the cache when offline.)
 *
 * Not cached → fetch from Supabase and cache it for next time.
 */
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  const cached = await getQuizBySlugFromCache(slug);
  if (cached?.questions?.length) {
    revalidateQuiz(slug); // best-effort refresh, non-blocking
    return cachedToQuiz(cached);
  }

  // Not cached locally. Skip the network entirely when we know we're offline so
  // an un-downloaded quiz fails fast instead of hanging on a doomed request.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return null;
  }
  try {
    return await fetchQuizFromNetwork(slug);
  } catch {
    return null; // offline / unreachable and not downloaded
  }
}

/** Fetch a quiz from Supabase and cache its content. Throws on network error. */
async function fetchQuizFromNetwork(slug: string): Promise<Quiz | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  void putQuiz({
    id: data.id,
    slug: data.slug,
    title: data.title,
    question_count: data.question_count,
    difficulty: data.difficulty,
    questions: data.questions,
  });
  return data;
}

/** Background refresh of cached content; skipped when offline, never throws. */
function revalidateQuiz(slug: string): void {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  void fetchQuizFromNetwork(slug).catch(() => {});
}

function cachedToQuiz(c: CachedQuiz): Quiz {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    question_count: c.question_count,
    difficulty: c.difficulty,
    questions: c.questions ?? [],
    created_by: null,
    created_at: "",
    updated_at: "",
  };
}
