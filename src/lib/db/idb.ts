"use client";

/**
 * IndexedDB offline cache (ENGINEERING-DESIGN.md §5).
 *
 * Holds only the user's saved/completed quizzes + their content, plus an
 * outbox of writes made offline. Supabase remains the source of truth; this is
 * a per-device mirror so saved/completed quizzes work with no connection.
 *
 * Everything is guarded: in environments without IndexedDB (SSR, the test
 * runner) the helpers no-op and reads return empty, so callers never throw.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Quiz } from "@/lib/types";

/** A quiz cached for offline render/replay. `questions` present once downloaded. */
export interface CachedQuiz {
  id: string;
  slug: string | null;
  title: string;
  question_count: number;
  difficulty: string | null;
  questions?: Quiz["questions"];
}

export interface SaveRow {
  quiz_id: string;
  is_offline: boolean;
  saved_at: string;
}

export interface HistoryRow {
  id: string;
  quiz_id: string;
  score: number;
  question_count: number;
  completed_at: string;
}

/**
 * An in-progress (unfinished) quiz attempt, persisted durably so it survives a
 * cold launch and is available offline. Unlike the sessionStorage copy (which
 * is cleared when the app is terminated), this powers the Home "Resume" card.
 * Rows exist only while an attempt is unfinished — deleted on finish/retry.
 */
export interface ProgressRow {
  quiz_id: string;
  slug: string | null;
  title: string;
  question_count: number;
  answers: (number | null)[];
  current_index: number;
  updated_at: string;
}

/** A mutation made locally, queued to push to Supabase when online. */
export type OutboxOp =
  | { kind: "save_upsert"; row: SaveRow }
  | { kind: "save_delete"; quiz_id: string }
  | { kind: "history_insert"; row: HistoryRow };

export interface OutboxItem {
  localId: string;
  op: OutboxOp;
  queuedAt: string;
}

interface RTTSchema extends DBSchema {
  quizzes: { key: string; value: CachedQuiz; indexes: { by_slug: string } };
  saves: { key: string; value: SaveRow; indexes: { by_saved_at: string } };
  history: {
    key: string;
    value: HistoryRow;
    indexes: { by_completed_at: string };
  };
  outbox: { key: string; value: OutboxItem };
  meta: { key: string; value: { key: string; value: unknown } };
  progress: { key: string; value: ProgressRow };
}

const DB_NAME = "roadtrip-trivia";
const DB_VERSION = 2;

function idbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBPDatabase<RTTSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<RTTSchema>> | null {
  if (!idbAvailable()) return null;
  if (!dbPromise) {
    dbPromise = openDB<RTTSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const quizzes = db.createObjectStore("quizzes", { keyPath: "id" });
          quizzes.createIndex("by_slug", "slug");
          const saves = db.createObjectStore("saves", { keyPath: "quiz_id" });
          saves.createIndex("by_saved_at", "saved_at");
          const history = db.createObjectStore("history", { keyPath: "id" });
          history.createIndex("by_completed_at", "completed_at");
          db.createObjectStore("outbox", { keyPath: "localId" });
          db.createObjectStore("meta", { keyPath: "key" });
        }
        if (oldVersion < 2) {
          db.createObjectStore("progress", { keyPath: "quiz_id" });
        }
      },
    }).catch((e) => {
      // If the DB can't open (private mode, quota), disable the cache rather
      // than breaking the app.
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

// --- meta ------------------------------------------------------------------

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb()?.catch(() => null);
  if (!db) return undefined;
  const row = await db.get("meta", key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.put("meta", { key, value });
}

// --- saves -----------------------------------------------------------------

export async function getSaves(): Promise<SaveRow[]> {
  const db = await getDb()?.catch(() => null);
  if (!db) return [];
  return db.getAll("saves");
}

export async function putSave(row: SaveRow): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.put("saves", row);
}

export async function deleteSave(quizId: string): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.delete("saves", quizId);
}

export async function replaceSaves(rows: SaveRow[]): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  const tx = db.transaction("saves", "readwrite");
  await tx.store.clear();
  for (const row of rows) await tx.store.put(row);
  await tx.done;
}

// --- history ---------------------------------------------------------------

export async function getHistory(): Promise<HistoryRow[]> {
  const db = await getDb()?.catch(() => null);
  if (!db) return [];
  return db.getAll("history");
}

export async function putHistory(row: HistoryRow): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.put("history", row);
}

/** Merge remote history into the cache (append-only union by id). */
export async function mergeHistory(rows: HistoryRow[]): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  const tx = db.transaction("history", "readwrite");
  for (const row of rows) await tx.store.put(row);
  await tx.done;
}

// --- quizzes (content cache) -----------------------------------------------

export async function putQuiz(quiz: CachedQuiz): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.put("quizzes", quiz);
}

export async function getQuizById(id: string): Promise<CachedQuiz | undefined> {
  const db = await getDb()?.catch(() => null);
  if (!db) return undefined;
  return db.get("quizzes", id);
}

export async function getQuizBySlugFromCache(
  slug: string,
): Promise<CachedQuiz | undefined> {
  const db = await getDb()?.catch(() => null);
  if (!db) return undefined;
  return db.getFromIndex("quizzes", "by_slug", slug);
}

export async function getAllCachedQuizzes(): Promise<CachedQuiz[]> {
  const db = await getDb()?.catch(() => null);
  if (!db) return [];
  return db.getAll("quizzes");
}

/**
 * Drop a quiz's downloaded questions from the cache (keeping its metadata so it
 * still renders in lists). Used when the user deletes a download.
 */
export async function removeQuizContent(id: string): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  const existing = await db.get("quizzes", id);
  if (!existing) return;
  await db.put("quizzes", { ...existing, questions: undefined });
}

// --- progress (durable in-progress attempts) -------------------------------

export async function putProgress(row: ProgressRow): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.put("progress", row);
}

export async function getProgress(
  quizId: string,
): Promise<ProgressRow | undefined> {
  const db = await getDb()?.catch(() => null);
  if (!db) return undefined;
  return db.get("progress", quizId);
}

export async function deleteProgress(quizId: string): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.delete("progress", quizId);
}

export async function getAllProgress(): Promise<ProgressRow[]> {
  const db = await getDb()?.catch(() => null);
  if (!db) return [];
  return db.getAll("progress");
}

// --- outbox ----------------------------------------------------------------

export async function enqueue(op: OutboxOp): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.put("outbox", {
    localId: crypto.randomUUID(),
    op,
    queuedAt: new Date().toISOString(),
  });
}

export async function getOutbox(): Promise<OutboxItem[]> {
  const db = await getDb()?.catch(() => null);
  if (!db) return [];
  const items = await db.getAll("outbox");
  return items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

export async function dequeue(localId: string): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  await db.delete("outbox", localId);
}

// --- wipe (sign-out / user switch) -----------------------------------------

/** Clear all per-user stores so the next user can't see this user's data. */
export async function wipe(): Promise<void> {
  const db = await getDb()?.catch(() => null);
  if (!db) return;
  const tx = db.transaction(
    ["quizzes", "saves", "history", "outbox", "meta", "progress"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("quizzes").clear(),
    tx.objectStore("saves").clear(),
    tx.objectStore("history").clear(),
    tx.objectStore("outbox").clear(),
    tx.objectStore("meta").clear(),
    tx.objectStore("progress").clear(),
  ]);
  await tx.done;
}
