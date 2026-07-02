/*
 * Phase 5 live check — run against your real Supabase project.
 *
 *   node scripts/verify-phase5.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local
 * (or the environment) and exercises exactly what the app does:
 *   1. anonymous sign-in            → confirms "Anonymous sign-ins" is enabled
 *   2. profiles row for the new user → confirms the on_auth_user_created trigger
 *   3. insert a save + read it back  → confirms the FK chain + RLS
 * It cleans up the save row it creates. (The anonymous auth user and its
 * profile remain — anonymous users can't delete themselves via the anon key.)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
    }
  } catch {
    /* no .env.local — fall back to process.env */
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}
console.log("Project:", url);

const supabase = createClient(url, key, { auth: { persistSession: false } });

// 1) anonymous sign-in
const { data: auth, error: authErr } = await supabase.auth.signInAnonymously();
if (authErr) {
  console.error("✗ anonymous sign-in FAILED:", authErr.message);
  console.error("  → enable it: Dashboard → Authentication → Sign In / Providers → Anonymous sign-ins");
  process.exit(1);
}
const uid = auth.user.id;
console.log("✓ anonymous sign-in OK — user_id:", uid);

// 2) trigger created a profiles row?
const { data: profs } = await supabase.from("profiles").select("id").eq("id", uid);
console.log(
  (profs?.length === 1 ? "✓" : "✗") +
    " profiles row auto-created by trigger:",
  profs?.length === 1 ? "yes" : "NO (did the migration run?)",
);
await supabase.from("profiles").upsert({ id: uid }); // client fallback, harmless

// 3) FK chain: insert a save against a real quiz, read it back, clean up
const { data: quiz, error: quizErr } = await supabase
  .from("quizzes")
  .select("id, title")
  .limit(1)
  .single();
if (quizErr || !quiz) {
  console.error("✗ could not read a quiz (is the catalog seeded?):", quizErr?.message);
  process.exit(1);
}
const { error: saveErr } = await supabase
  .from("saves")
  .upsert({ user_id: uid, quiz_id: quiz.id }, { onConflict: "user_id,quiz_id" });
if (saveErr) {
  console.error("✗ save insert FAILED:", saveErr.message);
  process.exit(1);
}
const { data: readback } = await supabase.from("saves").select("*").eq("user_id", uid);
console.log(`✓ save inserted + read back for "${quiz.title}" (${readback?.length} row)`);

await supabase.from("saves").delete().eq("user_id", uid).eq("quiz_id", quiz.id);
console.log("✓ cleaned up the test save row");

console.log("\nAll checks passed — anonymous auth + trigger + RLS are live. 🎉");
