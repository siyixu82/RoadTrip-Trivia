"use client";

import { useEffect, useState } from "react";

/** Chrome/Android's non-standard install-prompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rtt-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * "Add to Home Screen" affordance so the PWA gets installed (unlocking offline
 * play + persistent storage). Two paths:
 *   - Chrome/Android: capture `beforeinstallprompt` and drive the native prompt.
 *   - iOS Safari: no programmatic API — show the Share → Add to Home Screen hint.
 * Hidden when already installed (standalone) or previously dismissed.
 */
// Visibility mode, decided client-side once the browser APIs are readable.
//   hidden  → installed, dismissed, or Android before the prompt event fires
//   ios     → iOS Safari (manual Add to Home Screen hint)
//   android → Chromium captured a `beforeinstallprompt` (native Install button)
type Mode = "hidden" | "ios" | "android";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<Mode>("hidden");

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") return;

    // iOS never fires beforeinstallprompt — reading navigator here (a browser
    // API unavailable during SSR) is exactly the external-system sync effects
    // are for; the initial "hidden" render matches the server markup.
    if (isIos()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("ios");
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // stash it so we can trigger the prompt on our own button
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => dismiss();
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setMode("hidden");
    setDeferred(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    dismiss();
  }

  if (mode === "hidden") return null;
  const showIosHint = mode === "ios";

  return (
    <div className="mx-auto w-full max-w-xl px-5 pt-4">
      <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-[#F5A623]/60 bg-[#FFF8EC] p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F5A623] bg-white text-lg">
          📲
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">Install RoadTrip Trivia</p>
          {showIosHint ? (
            <p className="mt-0.5 text-[13px] leading-snug text-[#1a1a1a]/60">
              Tap <span aria-hidden>⎋</span> Share, then{" "}
              <span className="font-bold">Add to Home Screen</span> for offline play.
            </p>
          ) : (
            <p className="mt-0.5 text-[13px] leading-snug text-[#1a1a1a]/60">
              Add it to your home screen to play offline on the road.
            </p>
          )}
          {deferred && (
            <button
              type="button"
              onClick={install}
              className="mt-2 rounded-full border-2 border-[#F5A623] bg-[#F5A623] px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#e0951c]"
            >
              Install
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#1a1a1a]/12 text-[#1a1a1a]/40 transition-colors hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]/60"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
