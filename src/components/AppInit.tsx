"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { initAuth, useUser } from "@/lib/auth/authStore";
import {
  flushOutbox,
  initLibrary,
  repairOfflineContent,
} from "@/lib/library/library";

const SESSION_FLAG = "rtt-session-active";

/** True when running as an installed / home-screen PWA (not a browser tab). */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag for home-screen apps.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * App bootstrap (render-less): signs the user in anonymously, hydrates the
 * library for the current user, and flushes the offline outbox on reconnect.
 * Mounted once near the root.
 */
export function AppInit() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Installed-PWA launch behavior:
  //   (a) fully closed → reopened  = cold launch → land on Home.
  //   (b) backgrounded → reopened  = resume      = stay on the current page.
  // `sessionStorage` is the discriminator: it survives a resume (the document
  // stays alive) but is cleared when the app is terminated, so its absence means
  // a genuine cold launch. Scoped to standalone so browser tabs / deep links /
  // refreshes are never redirected. Runs once, on the initial mount only.
  useEffect(() => {
    if (typeof window === "undefined" || !isStandalone()) return;
    const fresh = sessionStorage.getItem(SESSION_FLAG) === null;
    sessionStorage.setItem(SESSION_FLAG, "1");
    if (fresh && pathname !== "/") router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kick off anonymous sign-in once.
  useEffect(() => {
    void initAuth();
  }, []);

  // (Re)hydrate the library whenever the signed-in user changes.
  useEffect(() => {
    void initLibrary(user?.id ?? null);
  }, [user?.id]);

  // On reconnect, flush pending writes and download any offline-marked quiz
  // whose content isn't cached yet (e.g. a download interrupted by going offline).
  useEffect(() => {
    const onOnline = () => {
      void flushOutbox();
      void repairOfflineContent();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  // Register the app-shell service worker (production only — a dev SW fights
  // Turbopack HMR). Enables offline boot, and auto-updates to the newest deploy:
  // each build stamps a fresh VERSION into /sw.js (scripts/gen-sw.mjs), so the
  // browser detects a changed worker. We nudge that check on launch and whenever
  // the tab becomes visible (iOS home-screen apps check very lazily on their
  // own), and reload once the new worker takes control so the UI is current.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const sw = navigator.serviceWorker;
    // Only auto-reload if a worker was already controlling this page: the very
    // first install also fires `controllerchange`, and reloading then is both
    // pointless and a loop risk.
    const hadController = !!sw.controller;
    let refreshing = false;

    const onControllerChange = () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    sw.addEventListener("controllerchange", onControllerChange);

    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => void registration?.update().catch(() => {});
    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    sw.register("/sw.js")
      .then((reg) => {
        registration = reg;
        checkForUpdate(); // in case a new worker shipped since last launch
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch(() => {});

    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
