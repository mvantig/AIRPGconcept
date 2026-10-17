// Shared game model. Everything here is plain JSON so a save is just this object.

export const STAT_KEYS = ["might", "grace", "wits", "heart"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type GameMode = "fiction" | "history";
export type Tone = "heroic" | "grim" | "whimsical" | "mysterious";
export type Mood = "calm" | "tense" | "combat" | "wonder" | "dread" | "triumph" | "sorrow";
export type Difficulty = "trivial" | "easy" | "moderate" | "hard" | "heroic";
export type Risk = "safe" | "risky" | "desperate";
export type Outcome = "critical" | "success" | "partial" | "failure" | "fumble";
export type CodexKind = "character" | "place" | "faction" | "lore";

export interface Palette {
  /** Main accent, used for buttons, highlights and the HP bar glow. Hex. */
  accent: string;
  /** Secondary accent for links, quest progress and the codex. Hex. */
  accent2: string;
  /** Deep background tint the whole UI sits on. Hex, dark. */
  ink: string;
}

export interface World {
  mode: GameMode;
  /** What the player typed or picked. */
  seed: string;
  tone: Tone;
  title: string;
  tagline: string;
  /** Two or three sentences a back-of-the-box blurb would use. */
  premise: string;
  /** Art direction passed to every illustration so scenes look like one book. */
  artStyle: string;
  palette: Palette;
  /** The world's own names for the four core stats, e.g. might → "Chrome". */
  statLabels: Record<StatKey, string>;
  currency: string;
  factions: { name: string; summary: string }[];
  /** The hook the first scene opens on. */
  opening: string;
  /** History mode: the year and place, e.g. "1492, Florence". */
  era?: string;
}

export interface HeroDraft {
  name: string;
  epithet: string;
  concept: string;
  backstory: string;
  stats: Stats;
  /** Starting kit, three to four items. */
  kit: Item[];
  /** A short line describing their look, used to paint the portrait. */
  look: string;
}

export interface Hero extends HeroDraft {
  portrait?: string;
}

export interface Item {
  name: string;
  detail: string;
  /** One emoji standing in for an icon. */
  glyph: string;
}

export interface Quest {
  id: string;
  title: string;
  objective: string;
  status: "active" | "completed" | "failed";
  progress: number;
  /** Main quests are pinned to the top of the HUD. */
  main: boolean;
}

export interface CodexEntry {
  kind: CodexKind;
  name: string;
  summary: string;
  firstSeenTurn: number;
}

export interface ChronicleEntry {
  turn: number;
  chapter: number;
  text: string;
}

export interface Location {
  name: string;
  detail: string;
}

export interface HeroState {
  hp: number;
  maxHp: number;
  gold: number;
  xp: number;
  level: number;
  /** Fate points let the player reroll a failed check. */
  fate: number;
  conditions: string[];
  inventory: Item[];
  location: Location;
  /** Stat points earned by levelling up and not yet spent. */
  unspentPoints: number;
}

export interface Choice {
  label: string;
  stat: StatKey | null;
  difficulty: Difficulty;
  risk: Risk;
}

export interface Roll {
  stat: StatKey;
  statLabel: string;
  modifier: number;
  dc: number;
  dice: number[];
  /** The die that counted (highest with advantage, lowest with disadvantage). */
  natural: number;
  total: number;
  outcome: Outcome;
  advantage: "none" | "advantage" | "disadvantage";
  reason: string;
  rerolled?: boolean;
}

export type LogEntry =
  | { id: string; kind: "chapter"; turn: number; chapter: number; title: string }
  | { id: string; kind: "narration"; turn: number; text: string }
  | { id: string; kind: "action"; turn: number; text: string }
  | { id: string; kind: "roll"; turn: number; roll: Roll }
  | { id: string; kind: "effects"; turn: number; lines: EffectLine[] }
  | { id: string; kind: "note"; turn: number; text: string }
  | { id: string; kind: "system"; turn: number; text: string };

export interface EffectLine {
  tone: "good" | "bad" | "neutral" | "quest" | "level";
  text: string;
}

export interface Scene {
  imageId: string | null;
  prompt: string | null;
  mood: Mood;
}

export interface Game {
  id: string;
  version: 2;
  createdAt: number;
  updatedAt: number;
  world: World;
  hero: Hero;
  state: HeroState;
  quests: Quest[];
  codex: CodexEntry[];
  chronicle: ChronicleEntry[];
  log: LogEntry[];
  choices: Choice[];
  scene: Scene;
  /** Every illustration painted so far, newest last. */
  gallery: { imageId: string; caption: string; turn: number }[];
  turn: number;
  chapter: number;
  over: boolean;
}

/** What the narrator returns for a turn, before the engine validates it. */
export interface TurnResolution {
  narration: string;
  chapterTitle: string | null;
  chronicle: string;
  effects: {
    hpDelta: number;
    goldDelta: number;
    xp: number;
    itemsGained: Item[];
    itemsLost: string[];
    conditionsGained: string[];
    conditionsLost: string[];
    location: Location | null;
  };
  quests: { title: string; objective: string; status: Quest["status"]; progress: number; main: boolean }[];
  codex: { kind: CodexKind; name: string; summary: string }[];
  scene: { imagePrompt: string | null; mood: Mood };
  historyNote: string | null;
  choices: Choice[];
}

/** Events streamed from /api/turn to the client, one JSON object per SSE message. */
export type TurnEvent =
  | { type: "roll"; roll: Roll }
  | { type: "narration"; text: string }
  | { type: "resolution"; resolution: TurnResolution }
  | { type: "error"; message: string; retryable: boolean }
  | { type: "done" };

export interface TurnRequest {
  game: Game;
  action: string;
  /** A roll the client already made for a chosen action. */
  roll: Roll | null;
}
