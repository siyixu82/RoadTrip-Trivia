"use client";

import { useEffect } from "react";
import { initAuth, useUser } from "@/lib/auth/authStore";
import { flushOutbox, initLibrary } from "@/lib/library/library";

/**
 * App bootstrap (render-less): signs the user in anonymously, hydrates the
 * library for the current user, and flushes the offline outbox on reconnect.
 * Mounted once near the root.
 */
export function AppInit() {
  const user = useUser();

  // Kick off anonymous sign-in once.
  useEffect(() => {
    void initAuth();
  }, []);

  // (Re)hydrate the library whenever the signed-in user changes.
  useEffect(() => {
    void initLibrary(user?.id ?? null);
  }, [user?.id]);

  // Sync pending writes when the device comes back online.
  useEffect(() => {
    const onOnline = () => void flushOutbox();
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
