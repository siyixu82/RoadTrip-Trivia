"use client";

/**
 * Anonymous-first auth (ENGINEERING-DESIGN.md §6).
 *
 * On first visit we sign the user in anonymously so they immediately have a
 * user_id + profiles row — no signup friction. The user can later upgrade to
 * email/OAuth (the anonymous account is converted, not replaced).
 *
 * Resilient by design: if the Supabase env is missing or anonymous sign-in is
 * unavailable, the store reports `null` user and the app keeps working in a
 * local/in-memory mode rather than throwing.
 */

import { useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { wipe as wipeIdb } from "@/lib/db/idb";

export interface AppUser {
  id: string;
}

type Client = SupabaseClient<Database>;

let user: AppUser | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setUser(next: AppUser | null) {
  if (user?.id === next?.id) return;
  user = next;
  notify();
}

/** Returns the Supabase client, or null if env/config is missing. */
function clientOrNull(): Client | null {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

/** Ensure a profiles row exists for this user (FK target for saves/history). */
async function ensureProfile(client: Client, id: string): Promise<void> {
  try {
    await client.from("profiles").upsert({ id }, { onConflict: "id" });
  } catch {
    // Best effort — a server-side trigger also covers this.
  }
}

/**
 * Sign in anonymously if there's no session yet, and keep the store in sync
 * with auth state changes. Safe to call multiple times.
 */
export async function initAuth(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const client = clientOrNull();
  if (!client) return; // local-only mode

  client.auth.onAuthStateChange((_event, session) => {
    const u = session?.user ?? null;
    setUser(u ? { id: u.id } : null);
    if (u) void ensureProfile(client, u.id);
  });

  try {
    const { data } = await client.auth.getSession();
    let current = data.session?.user ?? null;
    if (!current) {
      const { data: anon, error } = await client.auth.signInAnonymously();
      if (error) return; // anon sign-in disabled / offline → local-only
      current = anon.user ?? null;
    }
    if (current) {
      setUser({ id: current.id });
      await ensureProfile(client, current.id);
    }
  } catch {
    // Network/config failure — stay in local-only mode.
  }
}

/**
 * Sign out and wipe the local cache so the next user on this device can't see
 * this user's saved/completed data.
 */
export async function signOut(): Promise<void> {
  const client = clientOrNull();
  try {
    await client?.auth.signOut();
  } finally {
    await wipeIdb();
    setUser(null);
  }
}

// --- React binding ---------------------------------------------------------

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getUser(): AppUser | null {
  return user;
}

export function useUser(): AppUser | null {
  return useSyncExternalStore(
    subscribe,
    getUser,
    () => null,
  );
}
