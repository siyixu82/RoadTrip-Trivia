/**
 * A fitting emoji per park, for quiz-card icon tiles. Every park in the catalog
 * has an explicit entry: the 🏞 fallback renders as a "framed picture" on many
 * platforms, which reads as a broken-image placeholder — so it exists only as
 * a safety net for slugs outside the catalog.
 */
const ICONS: Record<string, string> = {
  acadia: "🦞",
  "american-samoa": "🌺",
  arches: "🪨",
  badlands: "🦬",
  "big-bend": "🌵",
  biscayne: "🐠",
  "black-canyon": "🧗",
  "bryce-canyon": "🪨",
  canyonlands: "🏜️",
  "capitol-reef": "🍎",
  "carlsbad-caverns": "🦇",
  "channel-islands": "🦊",
  congaree: "🌳",
  "crater-lake": "🌀",
  "cuyahoga-valley": "🚂",
  "death-valley": "☀️",
  denali: "🏔️",
  "dry-tortugas": "🏰",
  everglades: "🐊",
  "gates-of-the-arctic": "❄️",
  "gateway-arch": "🌉",
  "glacier-bay": "🧊",
  glacier: "🏔️",
  "grand-canyon": "🏜️",
  "grand-teton": "⛰️",
  "great-basin": "🌌",
  "great-sand-dunes": "🏖️",
  "great-smoky-mountains": "🌫️",
  "guadalupe-mountains": "⛰️",
  haleakala: "🌅",
  "hawaii-volcanoes": "🌋",
  "hot-springs": "♨️",
  "indiana-dunes": "🏖️",
  "isle-royale": "🐺",
  "joshua-tree": "🌵",
  katmai: "🐻",
  "kenai-fjords": "🐋",
  "kings-canyon": "🌲",
  "kobuk-valley": "🦌",
  "lake-clark": "🎣",
  "lassen-volcanic": "🌋",
  "mammoth-cave": "🕳️",
  "mesa-verde": "🏛️",
  "mount-rainier": "🗻",
  "new-river-gorge": "🌉",
  "north-cascades": "🏔️",
  olympic: "🌲",
  "petrified-forest": "🪵",
  pinnacles: "🦅",
  redwood: "🌲",
  "rocky-mountain": "🏔️",
  saguaro: "🌵",
  sequoia: "🌲",
  shenandoah: "🍂",
  "theodore-roosevelt": "🐎",
  "virgin-islands": "🏝️",
  voyageurs: "🛶",
  "white-sands": "🤍",
  "wind-cave": "💨",
  "wrangell-st-elias": "🗻",
  yellowstone: "🌋",
  yosemite: "🏔️",
  zion: "🏜️",
};

export function parkIcon(slug: string | null): string {
  return (slug && ICONS[slug]) || "🌲";
}

/**
 * Short park name for card/header display — drops the redundant " Trivia"
 * suffix the catalog titles carry (e.g. "Grand Canyon Trivia" → "Grand Canyon").
 */
export function parkName(title: string): string {
  return title.replace(/\s+Trivia$/i, "");
}
