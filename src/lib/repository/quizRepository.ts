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
 * Online: read from Supabase and cache the content in IndexedDB so it can be
 * replayed offline. Offline (or on any network error): fall back to the cache,
 * so saved/completed quizzes still open without a connection.
 */
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (data) {
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
  } catch {
    // fall through to the offline cache below
  }

  const cached = await getQuizBySlugFromCache(slug);
  return cached?.questions ? cachedToQuiz(cached) : null;
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
