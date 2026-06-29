"use client";

/**
 * Personal library — saved quizzes + completion history.
 *
 * PHASE 4 PLACEHOLDER: backed by `localStorage` on the device, with no auth.
 * The UI imports only from this module, so Phase 5 can swap the internals for
 * Supabase (source of truth) + IndexedDB (offline cache) without touching any
 * component — same shape as the `quizRepository` abstraction.
 *
 * Reactivity is via `useSyncExternalStore`: writes update an in-memory cache,
 * persist to localStorage, and notify subscribers. A `storage` listener keeps
 * other tabs in sync.
 */

import { useSyncExternalStore } from "react";
import type { QuizSummary } from "@/lib/types";

/** A bookmarked quiz. `is_offline` is the PRD "Download" pin. */
export interface SavedQuiz {
  id: string;
  slug: string | null;
  title: string;
  question_count: number;
  is_offline: boolean;
  saved_at: string; // ISO
}

/** One completed attempt (append-only, newest first). */
export interface HistoryEntry {
  id: string;
  quiz_id: string;
  slug: string | null;
  title: string;
  score: number;
  question_count: number;
  completed_at: string; // ISO
}

const SAVES_KEY = "rtt.saves.v1";
const HISTORY_KEY = "rtt.history.v1";

type Listener = () => void;

/**
 * A localStorage-backed, reactive list under one key. Snapshots are cached so
 * `useSyncExternalStore` sees a stable reference until the data actually
 * changes (required to avoid render loops).
 */
function createCollection<T>(key: string, empty: readonly T[]) {
  let cache: T[] | null = null;
  const listeners = new Set<Listener>();

  function read(): T[] {
    if (cache) return cache;
    if (typeof window === "undefined") return empty as T[];
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      cache = [];
    }
    return cache;
  }

  function write(next: T[]): void {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage full / unavailable (private mode): keep the in-memory copy.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(l: Listener): () => void {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        cache = null; // re-read lazily on next snapshot
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { read, write, subscribe };
}

const EMPTY_SAVES: readonly SavedQuiz[] = [];
const EMPTY_HISTORY: readonly HistoryEntry[] = [];

const saves = createCollection<SavedQuiz>(SAVES_KEY, EMPTY_SAVES);
const history = createCollection<HistoryEntry>(HISTORY_KEY, EMPTY_HISTORY);

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// --- Hooks (read) ----------------------------------------------------------

export function useSaves(): SavedQuiz[] {
  return useSyncExternalStore(
    saves.subscribe,
    saves.read,
    () => EMPTY_SAVES as SavedQuiz[],
  );
}

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(
    history.subscribe,
    history.read,
    () => EMPTY_HISTORY as HistoryEntry[],
  );
}

export function useIsSaved(quizId: string): boolean {
  return useSaves().some((s) => s.id === quizId);
}

// --- Actions (write) -------------------------------------------------------

/** Add a bookmark if absent, or remove it if already saved. */
export function toggleSave(quiz: QuizSummary): void {
  const list = saves.read();
  if (list.some((s) => s.id === quiz.id)) {
    saves.write(list.filter((s) => s.id !== quiz.id));
    return;
  }
  const entry: SavedQuiz = {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    question_count: quiz.question_count,
    is_offline: false,
    saved_at: new Date().toISOString(),
  };
  saves.write([entry, ...list]);
}

export function removeSave(quizId: string): void {
  saves.write(saves.read().filter((s) => s.id !== quizId));
}

/** Toggle the "Download" (offline) pin on a saved quiz. */
export function setDownloaded(quizId: string, value: boolean): void {
  saves.write(
    saves.read().map((s) => (s.id === quizId ? { ...s, is_offline: value } : s)),
  );
}

/** Append a completed attempt to history. */
export function recordCompletion(input: {
  quizId: string;
  slug: string | null;
  title: string;
  score: number;
  questionCount: number;
}): void {
  const entry: HistoryEntry = {
    id: uuid(),
    quiz_id: input.quizId,
    slug: input.slug,
    title: input.title,
    score: input.score,
    question_count: input.questionCount,
    completed_at: new Date().toISOString(),
  };
  history.write([entry, ...history.read()]);
}
