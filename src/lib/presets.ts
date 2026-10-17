import type { GameMode, Tone } from "@/lib/types";

export interface Preset {
  title: string;
  seed: string;
  blurb: string;
  colors: [string, string];
  tone: Tone;
}

export const FICTION_PRESETS: Preset[] = [
  {
    title: "Drowned Lanterns",
    seed: "A canal city sinking into the sea, where the dead are kept in glowing lanterns and someone is stealing them",
    blurb: "Gothic mystery in a sinking city",
    colors: ["#f2b45a", "#1f4f5a"],
    tone: "mysterious",
  },
  {
    title: "Neon Requiem",
    seed: "Cyberpunk megacity where memories are currency and you wake up missing three days",
    blurb: "Rain, chrome and stolen memories",
    colors: ["#ff4fa3", "#2b2a7a"],
    tone: "grim",
  },
  {
    title: "The Last Library",
    seed: "A wandering library on the back of a giant tortoise crossing a desert of glass",
    blurb: "Whimsical travels with books that bite",
    colors: ["#f5d27a", "#6b3f8f"],
    tone: "whimsical",
  },
  {
    title: "Starfall Frontier",
    seed: "Space western on a mining moon after the colony ship crashed, with salvagers, outlaws and an alien signal",
    blurb: "Dust, debts and a signal from below",
    colors: ["#ff9a4d", "#123a5c"],
    tone: "heroic",
  },
  {
    title: "Ashen Crown",
    seed: "Dark fantasy kingdom after the king's death, with a rotting crown that grants wishes at a cost",
    blurb: "Every wish has a price",
    colors: ["#e05a47", "#2a1a24"],
    tone: "grim",
  },
  {
    title: "Spirit Tea House",
    seed: "A tea house at the edge of the spirit world in a Ghibli-like mountain village",
    blurb: "Cozy, strange and quietly moving",
    colors: ["#9fe0b8", "#2f5c6e"],
    tone: "whimsical",
  },
  {
    title: "Deep Below",
    seed: "Lovecraftian deep-sea research station in 1962, where the crew is hearing singing from the trench",
    blurb: "Cosmic dread at crush depth",
    colors: ["#5fe0d2", "#0d1e33"],
    tone: "mysterious",
  },
  {
    title: "Sky Pirates",
    seed: "Airship pirates among floating islands, chasing a legendary storm that hides a lost city",
    blurb: "Swashbuckling above the clouds",
    colors: ["#ffd166", "#3a6ea5"],
    tone: "heroic",
  },
];

export const HISTORY_PRESETS: Preset[] = [
  { title: "Thebes, 1350 BC", seed: "1350 BC, Thebes, Egypt, during the reign of Akhenaten", blurb: "A pharaoh overturns the gods", colors: ["#e8c15a", "#2c4a6b"], tone: "mysterious" },
  { title: "Athens, 430 BC", seed: "430 BC, Athens, during the plague and the Peloponnesian War", blurb: "Democracy under siege and sickness", colors: ["#f0e2c0", "#6b2d2d"], tone: "grim" },
  { title: "Rome, 44 BC", seed: "March 44 BC, Rome, in the days before the Ides", blurb: "Daggers in the Senate", colors: ["#d6a35a", "#5a1f1f"], tone: "grim" },
  { title: "Viking Age, 870", seed: "870 AD, the settlement of Iceland by Norse families", blurb: "A new land at the edge of the world", colors: ["#9fd0e8", "#2b3440"], tone: "heroic" },
  { title: "Baghdad, 830", seed: "830 AD, Baghdad, the House of Wisdom under Caliph al-Ma'mun", blurb: "Scholars, translators and court intrigue", colors: ["#56c2b6", "#3d2a5c"], tone: "heroic" },
  { title: "Kyoto, 1180", seed: "1180, Kyoto, Japan, at the start of the Genpei War", blurb: "Samurai clans and a falling court", colors: ["#e06c75", "#1e2a3a"], tone: "grim" },
  { title: "Florence, 1492", seed: "April 1492, Florence, as Lorenzo de' Medici lies dying", blurb: "The Medici gambit", colors: ["#e2ab4a", "#5a2a1f"], tone: "mysterious" },
  { title: "Tenochtitlan, 1519", seed: "1519, Tenochtitlan, as Cortés approaches the Aztec capital", blurb: "Two worlds collide", colors: ["#4fb37f", "#5c2a2a"], tone: "grim" },
  { title: "Caribbean, 1715", seed: "1715, Nassau, the Republic of Pirates after the Spanish treasure fleet sinks", blurb: "Gold on the seabed, nooses on shore", colors: ["#4fd1e0", "#2b1f3a"], tone: "heroic" },
  { title: "Paris, 1793", seed: "1793, Paris, during the Reign of Terror", blurb: "Liberty, fear and the guillotine", colors: ["#e04f5f", "#1f2a44"], tone: "grim" },
  { title: "London, 1888", seed: "Autumn 1888, Whitechapel, London", blurb: "Fog, gaslight and a killer", colors: ["#d9b26b", "#22272e"], tone: "mysterious" },
  { title: "Apollo, 1969", seed: "July 1969, Houston and Cape Kennedy, the Apollo 11 mission", blurb: "The race to the Moon", colors: ["#f2f2f2", "#1b2a4a"], tone: "heroic" },
];

export const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: "heroic", label: "Heroic", hint: "Bold deeds, real triumph" },
  { id: "grim", label: "Grim", hint: "Hard choices, lasting scars" },
  { id: "whimsical", label: "Whimsical", hint: "Wonder and warm wit" },
  { id: "mysterious", label: "Mysterious", hint: "Secrets and slow dread" },
];

export function presetsFor(mode: GameMode): Preset[] {
  return mode === "history" ? HISTORY_PRESETS : FICTION_PRESETS;
}
