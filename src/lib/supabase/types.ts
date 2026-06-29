/**
 * Hand-authored types mirroring the Supabase schema in
 * docs/ENGINEERING-DESIGN.md §4. Can later be replaced by
 * `supabase gen types typescript` once the project is linked.
 */

/** A single multiple-choice question stored in quizzes.questions (jsonb). */
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correct_index: number; // 0–3
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          preferences: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferences?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      quizzes: {
        Row: {
          id: string;
          slug: string | null;
          title: string;
          question_count: number;
          difficulty: string | null;
          questions: QuizQuestion[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          title: string;
          question_count?: number;
          difficulty?: string | null;
          questions: QuizQuestion[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Insert"]>;
      };
      saves: {
        Row: {
          user_id: string;
          quiz_id: string;
          is_offline: boolean;
          saved_at: string;
        };
        Insert: {
          user_id: string;
          quiz_id: string;
          is_offline?: boolean;
          saved_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saves"]["Insert"]>;
      };
      history: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          question_count: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          question_count?: number;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["history"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
