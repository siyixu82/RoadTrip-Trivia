/** A fitting emoji per park, for quiz-card icon tiles. Falls back to 🏞. */
const ICONS: Record<string, string> = {
  "grand-canyon": "🏜️",
  yellowstone: "🌋",
  yosemite: "🏔️",
  zion: "🏜️",
  "great-smoky-mountains": "🏞️",
  "rocky-mountain": "🏔️",
  acadia: "🌊",
  glacier: "🏔️",
  arches: "🪨",
  "bryce-canyon": "🪨",
  olympic: "🌲",
  everglades: "🐊",
};

export function parkIcon(slug: string | null): string {
  return (slug && ICONS[slug]) || "🏞️";
}

/**
 * Short park name for card/header display — drops the redundant " Trivia"
 * suffix the catalog titles carry (e.g. "Grand Canyon Trivia" → "Grand Canyon").
 */
export function parkName(title: string): string {
  return title.replace(/\s+Trivia$/i, "");
}
