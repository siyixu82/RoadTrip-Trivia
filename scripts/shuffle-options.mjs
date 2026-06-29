// One-off-but-idempotent utility: redistributes each question's answer position
// so the correct option isn't always in the same slot.
//
// Deterministic: options are first sorted canonically (alphabetically), then
// shuffled with a seed derived from the question id. Re-running produces the
// exact same result, so it's safe to run repeatedly.
//
//   node scripts/shuffle-options.mjs

import { readdir, readFile, writeFile } from "node:fs/promises";

const DIR = new URL("../content/quizzes/", import.meta.url);

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleQuestion(q) {
  const correctValue = q.options[q.correct_index];
  const opts = [...q.options].sort(); // canonical starting order → idempotent
  const rng = mulberry32(hash(q.id));
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { ...q, options: opts, correct_index: opts.indexOf(correctValue) };
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".json"));
for (const file of files) {
  const quiz = JSON.parse(await readFile(new URL(file, DIR), "utf8"));
  quiz.questions = quiz.questions.map(shuffleQuestion);
  await writeFile(new URL(file, DIR), JSON.stringify(quiz, null, 2) + "\n");
}
console.log(`Shuffled options in ${files.length} files.`);
