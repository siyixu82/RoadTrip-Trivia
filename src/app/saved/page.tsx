"use client";

import { useState } from "react";
import Link from "next/link";
import {
  removeSave,
  setDownloaded,
  useHistory,
  useSaves,
  type HistoryEntry,
  type SavedQuiz,
} from "@/lib/library/library";

type View = "saved" | "history";

export default function SavedPage() {
  const [view, setView] = useState<View>("saved");
  const saves = useSaves();
  const history = useHistory();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Saved</h1>

      {/* Saved ↔ History toggle */}
      <div className="flex gap-1 rounded-full border-2 border-[#1a1a1a]/15 p-1">
        <ToggleButton
          active={view === "saved"}
          onClick={() => setView("saved")}
          label={`Saved${saves.length ? ` (${saves.length})` : ""}`}
        />
        <ToggleButton
          active={view === "history"}
          onClick={() => setView("history")}
          label={`History${history.length ? ` (${history.length})` : ""}`}
        />
      </div>

      {view === "saved" ? (
        <SavedList saves={saves} />
      ) : (
        <HistoryList history={history} />
      )}
    </main>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
        active ? "bg-[#F5A623] text-black" : "text-[#1a1a1a]/50"
      }`}
    >
      {label}
    </button>
  );
}

function SavedList({ saves }: { saves: SavedQuiz[] }) {
  if (saves.length === 0) {
    return (
      <EmptyState
        message="No saved quizzes yet."
        hint="Tap the ♡ on any quiz to save it here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {saves.map((quiz) => (
        <li
          key={quiz.id}
          className="flex flex-col gap-3 rounded-2xl border-2 border-[#1a1a1a]/15 bg-white/50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{quiz.title}</span>
              <span className="text-sm text-[#1a1a1a]/50">
                {quiz.question_count} questions
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeSave(quiz.id)}
              aria-label={`Remove ${quiz.title}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#1a1a1a]/15 text-[#1a1a1a]/50 transition-colors hover:border-red-500 hover:text-red-500"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2 border-t-2 border-dashed border-[#1a1a1a]/10 pt-3">
            {quiz.slug && (
              <Link
                href={`/quiz/${quiz.slug}`}
                className="rounded-full bg-[#F5A623] px-5 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
              >
                Play
              </Link>
            )}
            <button
              type="button"
              onClick={() => setDownloaded(quiz.id, !quiz.is_offline)}
              aria-pressed={quiz.is_offline}
              className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
                quiz.is_offline
                  ? "border-green-600 text-green-700"
                  : "border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:border-[#F5A623]"
              }`}
            >
              {quiz.is_offline ? "Downloaded ✓" : "Download"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <EmptyState
        message="No completed quizzes yet."
        hint="Finish a quiz and your score lands here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#1a1a1a]/15 bg-white/50 p-4"
        >
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{entry.title}</span>
            <span className="text-sm text-[#1a1a1a]/50">
              {formatDate(entry.completed_at)} · {entry.score}/
              {entry.question_count}
            </span>
          </div>
          {entry.slug && (
            <Link
              href={`/quiz/${entry.slug}`}
              className="shrink-0 rounded-full border-2 border-[#1a1a1a]/15 px-5 py-2 text-sm font-medium transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
            >
              Retry
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="font-medium text-[#1a1a1a]/60">{message}</p>
      <p className="text-sm text-[#1a1a1a]/40">{hint}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}
