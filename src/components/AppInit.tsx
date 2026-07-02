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
  // Turbopack HMR). Enables offline boot.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
