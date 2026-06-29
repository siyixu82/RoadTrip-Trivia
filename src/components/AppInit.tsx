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

  return null;
}
