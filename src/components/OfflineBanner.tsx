"use client";

import { useOnline } from "@/lib/useOnline";

/**
 * A slim banner shown whenever the device is offline. Makes the offline state
 * honest: the full catalog needs a connection (by design), so Home/Explore may
 * be empty, but downloaded quizzes in Saved still play. Rendered above the
 * page content; occupies no space when online.
 */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b-2 border-dashed border-[#1a1a1a]/12 bg-[#f0eee9] px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-wide text-[#1a1a1a]/55"
    >
      <span aria-hidden>📴</span>
      Offline — downloaded quizzes still play in Saved
    </div>
  );
}
