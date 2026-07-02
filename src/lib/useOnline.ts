"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive network status via `navigator.onLine` + the `online`/`offline`
 * events. SSR-safe: the server snapshot is always `true` (optimistic) so the
 * first client paint matches the markup and there's no hydration mismatch.
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
