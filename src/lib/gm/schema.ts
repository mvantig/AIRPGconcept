import { z } from "zod";
import { STAT_KEYS } from "@/lib/types";
import type { HeroDraft, TurnResolution, World } from "@/lib/types";

// JSON Schemas handed to Claude's structured outputs, plus lenient Zod parsers that
// repair anything slightly off instead of failing the whole turn.

const MOODS = ["calm", "tense", "combat", "wonder", "dread", "triumph", "sorrow"] as const;
const DIFFICULTIES = ["trivial", "easy", "moderate", "hard", "heroic"] as const;
const RISKS = ["safe", "risky", "desperate"] as const;
const CODEX_KINDS = ["character", "place", "faction", "lore"] as const;
const QUEST_STATUS = ["active", "completed", "failed"] as const;

const str = { type: "string" } as const;
const int = { type: "integer" } as const;
const bool = { type: "boolean" } as const;
const nullable = (schema: object) => ({ anyOf: [schema, { type: "null" }] });
const obj = (properties: Record<string, object>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const arr = (items: object) => ({ type: "array", items });
const statsSchema = obj(Object.fromEntries(STAT_KEYS.map((k) => [k, int])));
const itemSchema = obj({ name: str, detail: str, glyph: str });

export const TURN_JSON_SCHEMA = obj({
  narration: str,
  chapterTitle: nullable(str),
  chronicle: str,
  effects: obj({
    hpDelta: int,
    goldDelta: int,
    xp: int,
    itemsGained: arr(itemSchema),
    itemsLost: arr(str),
    conditionsGained: arr(str),
    conditionsLost: arr(str),
    location: nullable(obj({ name: str, detail: str })),
  }),
  quests: arr(obj({ title: str, objective: str, status: { type: "string", enum: QUEST_STATUS }, progress: int, main: bool })),
  codex: arr(obj({ kind: { type: "string", enum: CODEX_KINDS }, name: str, summary: str })),
  scene: obj({ imagePrompt: nullable(str), mood: { type: "string", enum: MOODS } }),
  historyNote: nullable(str),
  choices: arr(
    obj({
      label: str,
      stat: nullable({ type: "string", enum: STAT_KEYS }),
      difficulty: { type: "string", enum: DIFFICULTIES },
      risk: { type: "string", enum: RISKS },
    }),
  ),
});

const heroJsonSchema = obj({
  name: str,
  epithet: str,
  concept: str,
  backstory: str,
  look: str,
  stats: statsSchema,
  kit: arr(itemSchema),
});

export const WORLD_JSON_SCHEMA = obj({
  title: str,
  tagline: str,
  premise: str,
  artStyle: str,
  palette: obj({ accent: str, accent2: str, ink: str }),
  statLabels: obj(Object.fromEntries(STAT_KEYS.map((k) => [k, str]))),
  currency: str,
  factions: arr(obj({ name: str, summary: str })),
  opening: str,
  era: nullable(str),
  heroes: arr(heroJsonSchema),
});

// ---- Lenient parsers -------------------------------------------------------

const s = (fallback = "") => z.string().catch(fallback);
const n = (fallback = 0) => z.number().catch(fallback);
const item = z.object({ name: s(), detail: s(), glyph: s("✦") });
const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .catch("");

export const turnParser = z.object({
  narration: s(),
  // The UI already prints "Chapter IV", so drop a numbering prefix the model adds itself.
  chapterTitle: z
    .string()
    .nullable()
    .catch(null)
    .transform((t) => (t ? t.replace(/^\s*chapter\s+[\divxlc]+\s*[:.\-–—]\s*/i, "").trim() || null : null)),
  chronicle: s(),
  effects: z
    .object({
      hpDelta: n(),
      goldDelta: n(),
      xp: n(),
      itemsGained: z.array(item).catch([]),
      itemsLost: z.array(z.string()).catch([]),
      conditionsGained: z.array(z.string()).catch([]),
      conditionsLost: z.array(z.string()).catch([]),
      location: z.object({ name: s(), detail: s() }).nullable().catch(null),
    })
    .catch({ hpDelta: 0, goldDelta: 0, xp: 0, itemsGained: [], itemsLost: [], conditionsGained: [], conditionsLost: [], location: null }),
  quests: z
    .array(z.object({ title: s(), objective: s(), status: z.enum(QUEST_STATUS).catch("active"), progress: n(), main: z.boolean().catch(false) }))
    .catch([]),
  codex: z.array(z.object({ kind: z.enum(CODEX_KINDS).catch("lore"), name: s(), summary: s() })).catch([]),
  scene: z
    .object({ imagePrompt: z.string().nullable().catch(null), mood: z.enum(MOODS).catch("calm") })
    .catch({ imagePrompt: null, mood: "calm" }),
  historyNote: z.string().nullable().catch(null),
  choices: z
    .array(
      z.object({
        label: s(),
        stat: z.enum(STAT_KEYS).nullable().catch(null),
        difficulty: z.enum(DIFFICULTIES).catch("moderate"),
        risk: z.enum(RISKS).catch("risky"),
      }),
    )
    .catch([]),
});

export function parseTurn(raw: unknown): TurnResolution {
  return turnParser.parse(raw) as TurnResolution;
}

const heroParser = z.object({
  name: s("Wanderer"),
  epithet: s(),
  concept: s(),
  backstory: s(),
  look: s(),
  stats: z.object(Object.fromEntries(STAT_KEYS.map((k) => [k, n(1)]))).catch({ might: 1, grace: 1, wits: 2, heart: 1 }),
  kit: z.array(item).catch([]),
});

const worldParser = z.object({
  title: s("Untitled Realm"),
  tagline: s(),
  premise: s(),
  artStyle: s("painterly digital illustration, dramatic light"),
  palette: z.object({ accent: hex, accent2: hex, ink: hex }).catch({ accent: "", accent2: "", ink: "" }),
  statLabels: z.object(Object.fromEntries(STAT_KEYS.map((k) => [k, s()]))).catch({}),
  currency: s("coin"),
  factions: z.array(z.object({ name: s(), summary: s() })).catch([]),
  opening: s(),
  era: z.string().nullable().catch(null),
  heroes: z.array(heroParser).catch([]),
});

export const DEFAULT_PALETTE = { accent: "#e0a84f", accent2: "#7fb2c9", ink: "#0e0d12" };
export const DEFAULT_STAT_LABELS = { might: "Might", grace: "Grace", wits: "Wits", heart: "Heart" };

export function parseWorld(
  raw: unknown,
  base: Pick<World, "mode" | "seed" | "tone">,
): { world: World; heroes: HeroDraft[] } {
  const w = worldParser.parse(raw);
  const labels = Object.fromEntries(
    STAT_KEYS.map((k) => [k, (w.statLabels as Record<string, string>)[k]?.trim() || DEFAULT_STAT_LABELS[k]]),
  ) as World["statLabels"];
  const world: World = {
    ...base,
    title: w.title,
    tagline: w.tagline,
    premise: w.premise,
    artStyle: w.artStyle,
    palette: {
      accent: w.palette.accent || DEFAULT_PALETTE.accent,
      accent2: w.palette.accent2 || DEFAULT_PALETTE.accent2,
      ink: w.palette.ink || DEFAULT_PALETTE.ink,
    },
    statLabels: labels,
    currency: w.currency,
    factions: w.factions.filter((f) => f.name).slice(0, 4),
    opening: w.opening,
    era: w.era ?? undefined,
  };
  const heroes = w.heroes.slice(0, 3).map((h) => ({ ...h, stats: h.stats as HeroDraft["stats"] }));
  return { world, heroes };
}
