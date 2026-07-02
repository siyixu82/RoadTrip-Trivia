import { describe, expect, it } from "vitest";
import { buildHistory, buildSaved } from "./derive";
import type { CachedQuiz, HistoryRow, SaveRow } from "@/lib/db/idb";

const q: CachedQuiz["questions"] = [
  { id: "1", prompt: "?", options: ["a", "b", "c", "d"], correct_index: 0 },
];
const meta = new Map<string, CachedQuiz>([
  // "a" has cached questions (offline-ready); "b" is metadata only.
  ["a", { id: "a", slug: "zion", title: "Zion Trivia", question_count: 20, difficulty: "easy", questions: q }],
  ["b", { id: "b", slug: "arches", title: "Arches Trivia", question_count: 20, difficulty: "medium" }],
]);

describe("buildSaved", () => {
  it("joins rows with quiz meta and sorts newest first", () => {
    const rows: SaveRow[] = [
      { quiz_id: "a", is_offline: true, saved_at: "2026-01-01T00:00:00Z" },
      { quiz_id: "b", is_offline: false, saved_at: "2026-02-01T00:00:00Z" },
    ];
    const out = buildSaved(rows, meta);
    expect(out.map((s) => s.id)).toEqual(["b", "a"]); // newest first
    expect(out[1]).toMatchObject({ title: "Zion Trivia", slug: "zion", is_offline: true });
  });

  it("falls back gracefully when meta is missing", () => {
    const rows: SaveRow[] = [
      { quiz_id: "z", is_offline: false, saved_at: "2026-01-01T00:00:00Z" },
    ];
    expect(buildSaved(rows, meta)[0]).toMatchObject({
      id: "z",
      title: "Quiz",
      slug: null,
      question_count: 20,
    });
  });

  it("derives download_status from cached content, intent, and progress", () => {
    const byId = (id: string, off: boolean) =>
      buildSaved(
        [{ quiz_id: id, is_offline: off, saved_at: "2026-01-01T00:00:00Z" }],
        meta,
        new Set(["b"]), // "b" is mid-download
      )[0].download_status;

    expect(byId("a", true)).toBe("ready"); // content cached
    expect(byId("a", false)).toBe("none"); // not marked offline
    expect(byId("b", true)).toBe("downloading"); // in the downloading set, no content
    // Offline-marked, no content, not downloading → needs retry.
    expect(
      buildSaved(
        [{ quiz_id: "b", is_offline: true, saved_at: "2026-01-01T00:00:00Z" }],
        meta,
      )[0].download_status,
    ).toBe("error");
  });
});

describe("buildHistory", () => {
  it("joins rows with quiz meta and sorts newest first", () => {
    const rows: HistoryRow[] = [
      { id: "h1", quiz_id: "a", score: 17, question_count: 20, completed_at: "2026-01-01T00:00:00Z" },
      { id: "h2", quiz_id: "b", score: 12, question_count: 20, completed_at: "2026-03-01T00:00:00Z" },
    ];
    const out = buildHistory(rows, meta);
    expect(out.map((h) => h.id)).toEqual(["h2", "h1"]);
    expect(out[0]).toMatchObject({ title: "Arches Trivia", score: 12 });
  });
});
