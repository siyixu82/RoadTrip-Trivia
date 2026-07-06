"use client";

import { useOnline } from "@/lib/useOnline";

/**
 * Shared loading / error presentation for the catalog (Home + Explore), so both
 * screens give the same honest feedback instead of a bare "Loading…" or a raw
 * error string. Loading shows shaped placeholders; errors are phrased for people
 * (offline is expected, not a fault) and always offer a way to recover.
 */

/** Pulsing placeholder cards — gives the load a shape instead of blank text. */
export function CatalogSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-2xl border-2 border-[#1a1a1a]/8 bg-white p-3.5"
        >
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-[#1a1a1a]/10" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#1a1a1a]/10" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#1a1a1a]/10" />
          </div>
          <div className="h-9 w-16 shrink-0 animate-pulse rounded-full bg-[#1a1a1a]/10" />
        </li>
      ))}
    </ul>
  );
}

/** Friendly, recoverable error. Distinguishes "you're offline" from a real fault. */
export function CatalogError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const online = useOnline();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="text-4xl opacity-40" aria-hidden>
        {online ? "🤔" : "📴"}
      </span>
      <p className="font-bold text-[#1a1a1a]/60">
        {online ? "Couldn’t load quizzes" : "You’re offline"}
      </p>
      <p className="max-w-[16rem] text-sm text-[#1a1a1a]/45">
        {online
          ? "Something went wrong reaching the catalog."
          : "The full catalog needs a connection. Downloaded quizzes still play in Saved."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-full border-2 border-[#1a1a1a] bg-[#F5A623] px-6 py-2 font-bold text-[#1a1a1a] transition-opacity hover:opacity-90"
      >
        Try again
      </button>
      {/* Keep the raw reason available but out of the way for the curious. */}
      <p className="font-mono text-[10px] uppercase tracking-wide text-[#1a1a1a]/25">
        {message}
      </p>
    </div>
  );
}
