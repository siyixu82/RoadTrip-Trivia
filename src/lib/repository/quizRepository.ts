import { getSupabaseClient } from "@/lib/supabase/client";
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

/** Fetch one quiz (with its questions) by slug, or null if not found. */
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}
