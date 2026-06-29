import type { Database, QuizQuestion } from "@/lib/supabase/types";

/** Full quiz row, including the questions payload. */
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

/** Catalog list item — quiz metadata without the (larger) questions payload. */
export type QuizSummary = Pick<
  Quiz,
  "id" | "slug" | "title" | "question_count" | "difficulty"
>;

export type { QuizQuestion };
