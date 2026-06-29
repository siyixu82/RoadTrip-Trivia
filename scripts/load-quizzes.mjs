// Catalog loader: reads content/quizzes/*.json, validates, and upserts into
// Supabase `quizzes` (by slug). Content files are the source of truth.
//
// Usage:
//   node scripts/load-quizzes.mjs --dry-run        # validate only, no DB
//   node --env-file=.env.local scripts/load-quizzes.mjs   # validate + upsert
//
// Requires (for a real load): NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// The service-role key bypasses RLS (catalog writes are denied to anon/auth), so
// it must never ship to the browser — keep it in .env.local only.

import { readdir, readFile } from "node:fs/promises";

const DIR = new URL("../content/quizzes/", import.meta.url);
const dryRun = process.argv.includes("--dry-run");

/** Validate one quiz object; returns an array of error strings. */
function validateQuiz(quiz, file) {
  const errs = [];
  const req = (cond, msg) => !cond && errs.push(`${file}: ${msg}`);

  req(typeof quiz.slug === "string" && quiz.slug.length > 0, "missing slug");
  req(typeof quiz.title === "string" && quiz.title.length > 0, "missing title");
  req(Array.isArray(quiz.questions), "questions must be an array");
  if (!Array.isArray(quiz.questions)) return errs;

  req(quiz.questions.length === 20, `expected 20 questions, got ${quiz.questions.length}`);

  const ids = new Set();
  quiz.questions.forEach((q, i) => {
    const at = `${file} q[${i}]`;
    req(typeof q.id === "string" && q.id.length > 0, `${at}: missing id`);
    req(!ids.has(q.id), `${at}: duplicate id "${q.id}"`);
    ids.add(q.id);
    req(typeof q.prompt === "string" && q.prompt.length > 0, `${at}: missing prompt`);
    req(Array.isArray(q.options) && q.options.length === 4, `${at}: needs exactly 4 options`);
    if (Array.isArray(q.options)) {
      q.options.forEach((o, j) =>
        req(typeof o === "string" && o.length > 0, `${at}: option ${j} empty`),
      );
    }
    req(
      Number.isInteger(q.correct_index) && q.correct_index >= 0 && q.correct_index <= 3,
      `${at}: correct_index must be an integer 0-3`,
    );
  });
  return errs;
}

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error("No content/quizzes/*.json files found.");
    process.exit(1);
  }

  const quizzes = [];
  const allErrors = [];
  const slugs = new Set();

  for (const file of files) {
    let quiz;
    try {
      quiz = JSON.parse(await readFile(new URL(file, DIR), "utf8"));
    } catch (e) {
      allErrors.push(`${file}: invalid JSON — ${e.message}`);
      continue;
    }
    allErrors.push(...validateQuiz(quiz, file));
    if (slugs.has(quiz.slug)) allErrors.push(`${file}: duplicate slug "${quiz.slug}"`);
    slugs.add(quiz.slug);
    quizzes.push(quiz);
  }

  if (allErrors.length) {
    console.error(`✗ Validation failed (${allErrors.length}):`);
    allErrors.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }
  console.log(`✓ Validated ${quizzes.length} quizzes (${quizzes.length * 20} questions).`);

  if (dryRun) {
    quizzes.forEach((q) => console.log(`  • ${q.slug} — ${q.title}`));
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Run with: node --env-file=.env.local scripts/load-quizzes.mjs",
    );
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const rows = quizzes.map((q) => ({
    slug: q.slug,
    title: q.title,
    difficulty: q.difficulty ?? null,
    question_count: q.questions.length,
    questions: q.questions,
  }));

  const { data, error } = await supabase
    .from("quizzes")
    .upsert(rows, { onConflict: "slug" })
    .select("slug");

  if (error) {
    console.error("✗ Upsert failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Upserted ${data.length} quizzes to Supabase.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
