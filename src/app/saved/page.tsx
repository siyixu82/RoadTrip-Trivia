"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  removeSave,
  retryDownload,
  setDownloaded,
  useHistory,
  useSaves,
  type HistoryEntry,
  type SavedQuiz,
} from "@/lib/library/library";
import { parkIcon, parkName } from "@/lib/parkIcon";

type View = "saved" | "history";

export default function SavedPage() {
  const [view, setView] = useState<View>("saved");
  const saves = useSaves();
  const history = useHistory();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <span aria-hidden>♡</span> Saved &amp; History
      </h1>

      {/* Saved ↔ History segmented toggle */}
      <div className="flex gap-1 rounded-2xl border-2 border-[#1a1a1a]/8 bg-[#f0eee9] p-1">
        <ToggleButton
          active={view === "saved"}
          onClick={() => setView("saved")}
          label="Saved"
          count={saves.length}
        />
        <ToggleButton
          active={view === "history"}
          onClick={() => setView("history")}
          label="History"
          count={history.length}
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
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
        active
          ? "bg-white text-[#1a1a1a] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          : "text-[#1a1a1a]/45"
      }`}
    >
      {label}
      {count > 0 && <span className="text-[#1a1a1a]/40"> ({count})</span>}
    </button>
  );
}

function SavedList({ saves }: { saves: SavedQuiz[] }) {
  if (saves.length === 0) {
    return (
      <EmptyState
        icon="♡"
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
          className="rounded-2xl border-2 border-[#1a1a1a]/8 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#F5A623]/60 bg-[#FFF8EC] text-xl">
              {parkIcon(quiz.slug)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[15px] font-bold leading-tight">
                {parkName(quiz.title)}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-[#1a1a1a]/45">
                {quiz.question_count} questions
              </div>
            </div>
            <RemoveButton quiz={quiz} />
          </div>

          <div className="mt-3 flex items-center gap-2 border-t-2 border-dashed border-[#1a1a1a]/10 pt-3">
            {quiz.slug && (
              <Link
                href={`/quiz/${quiz.slug}`}
                className="rounded-full border-2 border-[#F5A623] bg-[#FFF8EC] px-4 py-1.5 text-sm font-bold text-[#F5A623] transition-colors hover:bg-[#F5A623] hover:text-white"
              >
                Play
              </Link>
            )}
            <DownloadButton quiz={quiz} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Removing a save is destructive (and, if downloaded, drops the offline copy),
 * so it asks for a second tap to confirm instead of firing on the first — with
 * an explicit Cancel and a 4s auto-revert so a stray tap can't lose a bookmark.
 * The trigger is a full 44px target per mobile touch guidelines.
 */
function RemoveButton({ quiz }: { quiz: SavedQuiz }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => removeSave(quiz.id)}
          className="rounded-full border-2 border-red-500 bg-red-500 px-3 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          aria-label="Cancel remove"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1a1a1a]/15 text-sm font-bold text-[#1a1a1a]/50 transition-colors hover:border-[#1a1a1a]/30"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Remove ${quiz.title}`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#1a1a1a]/12 text-[#1a1a1a]/40 transition-colors hover:border-red-500 hover:text-red-500"
    >
      ✕
    </button>
  );
}

function DownloadButton({ quiz }: { quiz: SavedQuiz }) {
  const base = "rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors";

  switch (quiz.download_status) {
    case "ready":
      return (
        <button
          type="button"
          onClick={() => setDownloaded(quiz.id, false)}
          aria-pressed
          aria-label={`Delete download of ${quiz.title}`}
          className={`${base} border-red-400 bg-red-50 text-red-600 hover:border-red-500`}
        >
          🗑 Delete
        </button>
      );
    case "downloading":
      return (
        <button
          type="button"
          disabled
          className={`${base} cursor-default border-[#F5A623]/50 text-[#1a1a1a]/50`}
        >
          Downloading…
        </button>
      );
    case "error":
      return (
        <button
          type="button"
          onClick={() => retryDownload(quiz.id)}
          className={`${base} border-red-500 bg-red-50 text-red-600`}
        >
          Retry download
        </button>
      );
    default:
      return (
        <button
          type="button"
          onClick={() => setDownloaded(quiz.id, true)}
          aria-pressed={false}
          className={`${base} border-[#1a1a1a]/15 text-[#1a1a1a]/55 hover:border-[#F5A623]`}
        >
          Download
        </button>
      );
  }
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon="🏁"
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
          className="flex items-center gap-3 rounded-2xl border-2 border-[#1a1a1a]/8 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#1a1a1a]/10 bg-[#f5f3ef] text-xl">
            {parkIcon(entry.slug)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-[15px] font-bold leading-tight">
              {parkName(entry.title)}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-[#1a1a1a]/45">
              {formatDate(entry.completed_at)}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="rounded-lg border-2 border-[#F5A623] bg-[#FFF8EC] px-2.5 py-0.5 text-sm font-bold text-[#F5A623]">
              {entry.score}/{entry.question_count}
            </span>
            {entry.slug && (
              <Link
                href={`/quiz/${entry.slug}`}
                className="rounded-full border-2 border-[#1a1a1a]/12 px-3 py-0.5 text-xs font-bold text-[#1a1a1a]/55 transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
              >
                Retry
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  icon,
  message,
  hint,
}: {
  icon: string;
  message: string;
  hint: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="text-4xl opacity-40" aria-hidden>
        {icon}
      </span>
      <p className="font-bold text-[#1a1a1a]/60">{message}</p>
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
