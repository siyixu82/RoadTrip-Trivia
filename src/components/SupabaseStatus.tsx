"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type Status =
  | { kind: "checking" }
  | { kind: "ok"; detail: string }
  | { kind: "error"; detail: string };

/**
 * Live Supabase connectivity check, rendered on the home page so a deployment
 * (local or Vercel) visibly proves the app can reach Supabase with its env vars.
 *
 * It runs a real query against `quizzes`. Before the Phase 1 migration that
 * table won't exist, so PostgREST returns PGRST205 — which still proves the
 * URL + anon key authenticated. After the migration this flips to a plain "ok".
 */
export function SupabaseStatus() {
  const [status, setStatus] = useState<Status>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from("quizzes").select("id").limit(1);

        if (cancelled) return;

        if (!error) {
          setStatus({ kind: "ok", detail: "connected · quizzes table found" });
        } else if (error.code === "PGRST205") {
          setStatus({
            kind: "ok",
            detail: "connected · schema not migrated yet",
          });
        } else {
          setStatus({ kind: "error", detail: error.message });
        }
      } catch (e) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          detail: e instanceof Error ? e.message : "unknown error",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const color =
    status.kind === "ok"
      ? "bg-green-500"
      : status.kind === "error"
        ? "bg-red-500"
        : "bg-zinc-400 animate-pulse";

  const label =
    status.kind === "checking"
      ? "Checking Supabase…"
      : status.kind === "ok"
        ? `Supabase ${status.detail}`
        : `Supabase error: ${status.detail}`;

  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/15">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
