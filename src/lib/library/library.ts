"use client";

/**
 * Personal library — saved quizzes + completion history.
 *
 * Phase 5: Supabase is the source of truth; IndexedDB is a per-device offline
 * mirror; an outbox buffers writes made offline and is flushed on reconnect.
 * The UI imports only the hooks/actions below — same surface as the Phase-4
 * localStorage placeholder, so no component changed when the backend did.
 *
 * Reactivity: an in-memory cache feeds `useSyncExternalStore`. Actions update
 * the cache optimistically (synchronously, never throwing), then persist to
 * IndexedDB + Supabase in the background (falling back to the outbox).
 */

import { useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { QuizSummary } from "@/lib/types";
import {
  buildHistory,
  buildSaved,
  type HistoryEntry,
  type SavedQuiz,
} from "@/lib/library/derive";
import {
  dequeue,
  enqueue,
  getAllCachedQuizzes,
  getHistory,
  getMeta,
  getOutbox,
  getSaves,
  mergeHistory,
  putHistory,
  putQuiz,
  putSave,
  replaceSaves,
  setMeta,
  wipe,
  deleteSave as idbDeleteSave,
  type CachedQuiz,
  type HistoryRow,
  type OutboxOp,
  type SaveRow,
} from "@/lib/db/idb";

export type { SavedQuiz, HistoryEntry };

// --- in-memory state -------------------------------------------------------

let currentUserId: string | null = null;
let hydrated = false;

let saveRows: SaveRow[] = [];
let historyRows: HistoryRow[] = [];
let metaMap = new Map<string, CachedQuiz>();
// Quiz ids whose offline content is currently being fetched (for honest UI).
const downloadingIds = new Set<string>();

const EMPTY_SAVES: readonly SavedQuiz[] = [];
const EMPTY_HISTORY: readonly HistoryEntry[] = [];
let derivedSaves: SavedQuiz[] = [];
let derivedHistory: HistoryEntry[] = [];

const listeners = new Set<() => void>();

function recompute() {
  derivedSaves = buildSaved(saveRows, metaMap, downloadingIds);
  derivedHistory = buildHistory(historyRows, metaMap);
  listeners.forEach((l) => l());
}

function rememberMeta(quiz: CachedQuiz) {
  metaMap.set(quiz.id, quiz);
  void putQuiz(quiz);
}

// --- Supabase helpers ------------------------------------------------------

type Client = SupabaseClient<Database>;

function clientOrNull(): Client | null {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

/** Push one mutation to Supabase. Returns false if it couldn't be applied. */
async function pushOp(op: OutboxOp): Promise<boolean> {
  const client = clientOrNull();
  const uid = currentUserId;
  if (!client || !uid) return false;
  try {
    if (op.kind === "save_upsert") {
      const { error } = await client.from("saves").upsert(
        {
          user_id: uid,
          quiz_id: op.row.quiz_id,
          is_offline: op.row.is_offline,
          saved_at: op.row.saved_at,
        },
        { onConflict: "user_id,quiz_id" },
      );
      return !error;
    }
    if (op.kind === "save_delete") {
      const { error } = await client
        .from("saves")
        .delete()
        .eq("user_id", uid)
        .eq("quiz_id", op.quiz_id);
      return !error;
    }
    const { error } = await client.from("history").insert({
      id: op.row.id,
      user_id: uid,
      quiz_id: op.row.quiz_id,
      score: op.row.score,
      question_count: op.row.question_count,
      completed_at: op.row.completed_at,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Try to push; on failure, queue for later. */
async function pushOrQueue(op: OutboxOp): Promise<void> {
  if (!(await pushOp(op))) await enqueue(op);
}

/** Flush queued writes in order; stop at the first failure (retry later). */
export async function flushOutbox(): Promise<void> {
  const items = await getOutbox();
  for (const item of items) {
    if (!(await pushOp(item.op))) break;
    await dequeue(item.localId);
  }
}

/** Pull the user's saves + history (and referenced quiz meta) from Supabase. */
async function pullRemote(): Promise<void> {
  const client = clientOrNull();
  const uid = currentUserId;
  if (!client || !uid) return;

  const [{ data: saveData, error: se }, { data: histData, error: he }] =
    await Promise.all([
      client.from("saves").select("quiz_id, is_offline, saved_at"),
      client
        .from("history")
        .select("id, quiz_id, score, question_count, completed_at"),
    ]);
  if (se || he) return;

  const remoteSaves = (saveData ?? []) as SaveRow[];
  const remoteHistory = (histData ?? []) as HistoryRow[];

  const ids = [
    ...new Set([
      ...remoteSaves.map((r) => r.quiz_id),
      ...remoteHistory.map((r) => r.quiz_id),
    ]),
  ];
  if (ids.length) {
    const { data: quizData } = await client
      .from("quizzes")
      .select("id, slug, title, question_count, difficulty")
      .in("id", ids);
    for (const q of quizData ?? []) {
      const cq: CachedQuiz = {
        id: q.id,
        slug: q.slug,
        title: q.title,
        question_count: q.question_count,
        difficulty: q.difficulty,
        questions: metaMap.get(q.id)?.questions,
      };
      metaMap.set(q.id, cq);
      void putQuiz(cq);
    }
  }

  saveRows = remoteSaves;
  historyRows = remoteHistory;
  await replaceSaves(saveRows);
  await mergeHistory(historyRows);
  recompute();
}

// --- lifecycle (called by AppInit) -----------------------------------------

/** Hydrate from IndexedDB (instant/offline), then sync with Supabase. */
export async function initLibrary(userId: string | null): Promise<void> {
  if (hydrated && userId === currentUserId) return;
  currentUserId = userId;
  hydrated = true;

  // Shared-device safety: if the cache belongs to a different user, wipe it.
  const cachedUid = await getMeta<string>("user_id");
  if (userId && cachedUid && cachedUid !== userId) await wipe();
  if (userId) await setMeta("user_id", userId);

  saveRows = await getSaves();
  historyRows = await getHistory();
  metaMap = new Map((await getAllCachedQuizzes()).map((q) => [q.id, q]));
  recompute();

  await flushOutbox();
  await pullRemote();
  await repairOfflineContent();
}

/**
 * Ensure every quiz the user marked for offline actually has its questions
 * cached locally. Closes the gap where `is_offline` synced from Supabase (or an
 * interrupted download) left a device without playable content.
 */
export async function repairOfflineContent(): Promise<void> {
  const missing = saveRows.filter(
    (s) => s.is_offline && !metaMap.get(s.quiz_id)?.questions?.length,
  );
  await Promise.all(missing.map((s) => ensureContentCached(s.quiz_id)));
}

/** Clear in-memory state on sign-out (IndexedDB wipe happens in signOut). */
export function resetLibrary(): void {
  currentUserId = null;
  hydrated = false;
  saveRows = [];
  historyRows = [];
  metaMap = new Map();
  recompute();
}

// --- hooks (read) ----------------------------------------------------------

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSaves(): SavedQuiz[] {
  return useSyncExternalStore(
    subscribe,
    () => derivedSaves,
    () => EMPTY_SAVES as SavedQuiz[],
  );
}

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => derivedHistory,
    () => EMPTY_HISTORY as HistoryEntry[],
  );
}

export function useIsSaved(quizId: string): boolean {
  return useSaves().some((s) => s.id === quizId);
}

// --- actions (write) -------------------------------------------------------

export function toggleSave(quiz: QuizSummary): void {
  if (saveRows.some((s) => s.quiz_id === quiz.id)) {
    removeSave(quiz.id);
    return;
  }
  const row: SaveRow = {
    quiz_id: quiz.id,
    is_offline: false,
    saved_at: new Date().toISOString(),
  };
  rememberMeta({
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    question_count: quiz.question_count,
    difficulty: quiz.difficulty,
  });
  saveRows = [row, ...saveRows];
  recompute();
  void putSave(row);
  void pushOrQueue({ kind: "save_upsert", row });
}

export function removeSave(quizId: string): void {
  saveRows = saveRows.filter((s) => s.quiz_id !== quizId);
  recompute();
  void idbDeleteSave(quizId);
  void pushOrQueue({ kind: "save_delete", quiz_id: quizId });
}

export function setDownloaded(quizId: string, value: boolean): void {
  let updated: SaveRow | undefined;
  saveRows = saveRows.map((s) => {
    if (s.quiz_id !== quizId) return s;
    updated = { ...s, is_offline: value };
    return updated;
  });
  if (!updated) return;
  recompute();
  void putSave(updated);
  void pushOrQueue({ kind: "save_upsert", row: updated });
  // Downloading means the *content* must be cached locally — not just a flag.
  // ensureContentCached surfaces real progress via download_status, so the
  // badge can't claim "Downloaded" until the questions are actually stored.
  if (value) void ensureContentCached(quizId);
}

/**
 * Guarantee a quiz's questions are cached in IndexedDB for offline play.
 * Idempotent: no-op if already cached. Reflects progress through the store
 * (downloading → ready | error) so the UI never shows a false "Downloaded".
 */
async function ensureContentCached(quizId: string): Promise<boolean> {
  if (metaMap.get(quizId)?.questions?.length) return true; // already offline-ready
  downloadingIds.add(quizId);
  recompute();
  try {
    return await cacheQuizContent(quizId);
  } finally {
    downloadingIds.delete(quizId);
    recompute();
  }
}

/** Re-attempt content downloads for a quiz the user marked offline. */
export function retryDownload(quizId: string): void {
  void ensureContentCached(quizId);
}

export function recordCompletion(input: {
  quizId: string;
  slug: string | null;
  title: string;
  score: number;
  questionCount: number;
}): void {
  const row: HistoryRow = {
    id: uuid(),
    quiz_id: input.quizId,
    score: input.score,
    question_count: input.questionCount,
    completed_at: new Date().toISOString(),
  };
  if (!metaMap.has(input.quizId)) {
    rememberMeta({
      id: input.quizId,
      slug: input.slug,
      title: input.title,
      question_count: input.questionCount,
      difficulty: null,
    });
  }
  historyRows = [row, ...historyRows];
  recompute();
  void putHistory(row);
  void pushOrQueue({ kind: "history_insert", row });
}

/**
 * Fetch a quiz's questions and cache them for offline play.
 * Returns whether the content is now cached (false if offline / not found).
 */
async function cacheQuizContent(quizId: string): Promise<boolean> {
  const client = clientOrNull();
  if (!client) return false;
  try {
    const { data, error } = await client
      .from("quizzes")
      .select("id, slug, title, question_count, difficulty, questions")
      .eq("id", quizId)
      .maybeSingle();
    if (error || !data?.questions) return false;
    rememberMeta(data as CachedQuiz);
    recompute();
    return true;
  } catch {
    // offline / not found — the offline intent (is_offline) still stands, so
    // initLibrary will retry the content download on the next online launch.
    return false;
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
