import type {
  Choice,
  CodexEntry,
  EffectLine,
  Game,
  Hero,
  HeroDraft,
  HeroState,
  Item,
  LogEntry,
  Quest,
  Roll,
  StatKey,
  Stats,
  TurnResolution,
  World,
} from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { DIFFICULTY_DC, rollCheck, type Rng } from "./dice";

export const STAT_BUDGET = 5;
export const STAT_MAX = 5;
export const STAT_MIN = -1;
export const FATE_MAX = 3;
export const INVENTORY_MAX = 24;
export const CONDITIONS_MAX = 5;
export const XP_PER_TURN_MAX = 60;
export const QUEST_XP = { side: 40, main: 100 } as const;

export function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function xpForLevel(level: number): number {
  return level * 100;
}

export function maxHpFor(stats: Stats, level: number): number {
  return 20 + stats.might * 2 + (level - 1) * 4;
}

export function statTotal(stats: Stats): number {
  return STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
}

/** Clamp each stat and trim the spread so a hero never starts above the point budget. */
export function normalizeStats(raw: Partial<Record<string, number>>): Stats {
  const stats = Object.fromEntries(
    STAT_KEYS.map((k) => [k, clampInt(raw[k] ?? 0, STAT_MIN, 4)]),
  ) as Stats;
  let guard = 20;
  while (statTotal(stats) > STAT_BUDGET && guard-- > 0) {
    const top = STAT_KEYS.reduce((a, b) => (stats[b] > stats[a] ? b : a));
    stats[top] -= 1;
  }
  return stats;
}

export function newGame(world: World, hero: Hero): Game {
  const stats = normalizeStats(hero.stats);
  const maxHp = maxHpFor(stats, 1);
  const now = Date.now();
  const state: HeroState = {
    hp: maxHp,
    maxHp,
    gold: 10,
    xp: 0,
    level: 1,
    fate: 2,
    conditions: [],
    inventory: dedupeItems(hero.kit).slice(0, 6),
    location: { name: world.era ?? world.title, detail: world.opening },
    unspentPoints: 0,
  };
  return {
    id: uid(),
    version: 2,
    createdAt: now,
    updatedAt: now,
    world,
    hero: { ...hero, stats },
    state,
    quests: [],
    codex: world.factions.map((f) => ({ kind: "faction", name: f.name, summary: f.summary, firstSeenTurn: 0 })),
    chronicle: [],
    log: [],
    choices: [],
    scene: { imageId: null, prompt: null, mood: "calm" },
    gallery: [],
    turn: 0,
    chapter: 0,
    over: false,
  };
}

export function heroFromDraft(draft: HeroDraft): Hero {
  return { ...draft, stats: normalizeStats(draft.stats) };
}

export function rollForChoice(game: Game, choice: Choice, rng: Rng = Math.random): Roll | null {
  if (!choice.stat || choice.difficulty === "trivial") return null;
  return rollCheck(
    {
      stat: choice.stat,
      statLabel: game.world.statLabels[choice.stat],
      modifier: game.hero.stats[choice.stat],
      dc: DIFFICULTY_DC[choice.difficulty],
      advantage: "none",
      reason: choice.label,
    },
    rng,
  );
}

export function canReroll(game: Game, roll: Roll | null): boolean {
  return !!roll && !roll.rerolled && game.state.fate > 0 && (roll.outcome === "failure" || roll.outcome === "fumble");
}

/** Spend a fate point to roll the same check again. The second result stands. */
export function rerollWithFate(game: Game, roll: Roll, rng: Rng = Math.random): { game: Game; roll: Roll } {
  if (!canReroll(game, roll)) return { game, roll };
  const next = rollCheck(
    { stat: roll.stat, statLabel: roll.statLabel, modifier: roll.modifier, dc: roll.dc, advantage: roll.advantage, reason: roll.reason },
    rng,
  );
  return {
    game: { ...game, state: { ...game.state, fate: game.state.fate - 1 } },
    roll: { ...next, rerolled: true },
  };
}

export function spendStatPoint(game: Game, stat: StatKey): Game {
  if (game.state.unspentPoints <= 0 || game.hero.stats[stat] >= STAT_MAX) return game;
  const stats = { ...game.hero.stats, [stat]: game.hero.stats[stat] + 1 };
  const maxHp = maxHpFor(stats, game.state.level);
  return {
    ...game,
    hero: { ...game.hero, stats },
    state: {
      ...game.state,
      unspentPoints: game.state.unspentPoints - 1,
      hp: game.state.hp + (maxHp - game.state.maxHp),
      maxHp,
    },
  };
}

export interface Applied {
  game: Game;
  lines: EffectLine[];
  leveledUp: boolean;
}

/**
 * Apply what the narrator decided, but only within the rules: HP and gold stay in range,
 * you can only lose items you carry, XP is capped, and quests pay out on completion.
 */
export function applyResolution(game: Game, res: TurnResolution, rolls: Roll[], action?: string): Applied {
  const turn = game.turn + 1;
  const lines: EffectLine[] = [];
  const log: LogEntry[] = [];
  const state: HeroState = { ...game.state, inventory: [...game.state.inventory], conditions: [...game.state.conditions] };
  let chapter = game.chapter;

  if (action) log.push({ id: uid(), kind: "action", turn, text: action });
  for (const roll of rolls) log.push({ id: uid(), kind: "roll", turn, roll });
  if (res.chapterTitle && res.chapterTitle.trim()) {
    chapter += 1;
    log.push({ id: uid(), kind: "chapter", turn, chapter, title: res.chapterTitle.trim() });
  } else if (chapter === 0) {
    chapter = 1;
    log.push({ id: uid(), kind: "chapter", turn, chapter, title: "Prologue" });
  }

  log.push({ id: uid(), kind: "narration", turn, text: res.narration.trim() });

  // HP
  const hpDelta = clampInt(res.effects.hpDelta, -state.maxHp, state.maxHp);
  if (hpDelta !== 0) {
    const before = state.hp;
    state.hp = clampInt(state.hp + hpDelta, 0, state.maxHp);
    const actual = state.hp - before;
    if (actual < 0) lines.push({ tone: "bad", text: `${actual} HP` });
    if (actual > 0) lines.push({ tone: "good", text: `+${actual} HP` });
  }

  // Gold
  const goldDelta = Math.max(clampInt(res.effects.goldDelta, -100000, 100000), -state.gold);
  if (goldDelta !== 0) {
    state.gold += goldDelta;
    lines.push({ tone: goldDelta > 0 ? "good" : "bad", text: `${goldDelta > 0 ? "+" : ""}${goldDelta} ${game.world.currency}` });
  }

  // Items
  for (const lost of res.effects.itemsLost.slice(0, 6)) {
    const idx = findItem(state.inventory, lost);
    if (idx >= 0) {
      const [removed] = state.inventory.splice(idx, 1);
      lines.push({ tone: "bad", text: `Lost ${removed.name}` });
    }
  }
  for (const item of dedupeItems(res.effects.itemsGained).slice(0, 4)) {
    if (state.inventory.length >= INVENTORY_MAX) break;
    if (findItem(state.inventory, item.name) >= 0) continue;
    state.inventory.push(cleanItem(item));
    lines.push({ tone: "good", text: `${item.glyph || "✦"} ${item.name}` });
  }

  // Conditions
  for (const c of res.effects.conditionsLost) {
    const idx = state.conditions.findIndex((x) => sameName(x, c));
    if (idx >= 0) {
      state.conditions.splice(idx, 1);
      lines.push({ tone: "good", text: `No longer ${c.toLowerCase()}` });
    }
  }
  for (const c of res.effects.conditionsGained) {
    const name = c.trim();
    if (!name || state.conditions.some((x) => sameName(x, name)) || state.conditions.length >= CONDITIONS_MAX) continue;
    state.conditions.push(name);
    lines.push({ tone: "bad", text: name });
  }

  // Location
  if (res.effects.location?.name?.trim() && !sameName(res.effects.location.name, state.location.name)) {
    state.location = { name: res.effects.location.name.trim(), detail: res.effects.location.detail?.trim() ?? "" };
    lines.push({ tone: "neutral", text: `→ ${state.location.name}` });
  }

  // Quests
  const quests: Quest[] = game.quests.map((q) => ({ ...q }));
  let questXp = 0;
  for (const update of res.quests.slice(0, 4)) {
    if (!update.title?.trim()) continue;
    const existing = quests.find((q) => sameName(q.title, update.title));
    const progress = clampInt(update.progress, 0, 100);
    if (existing) {
      if (existing.status !== "active") continue;
      existing.objective = update.objective?.trim() || existing.objective;
      existing.progress = update.status === "completed" ? 100 : progress;
      if (update.status !== existing.status) {
        existing.status = update.status;
        if (update.status === "completed") {
          questXp += existing.main ? QUEST_XP.main : QUEST_XP.side;
          lines.push({ tone: "quest", text: `Quest complete: ${existing.title}` });
        } else if (update.status === "failed") {
          lines.push({ tone: "bad", text: `Quest failed: ${existing.title}` });
        }
      }
    } else if (update.status === "active") {
      const hasMain = quests.some((q) => q.main && q.status === "active");
      quests.push({
        id: uid(),
        title: update.title.trim(),
        objective: update.objective?.trim() ?? "",
        status: "active",
        progress,
        main: !hasMain && (update.main || quests.length === 0),
      });
      lines.push({ tone: "quest", text: `New quest: ${update.title.trim()}` });
    }
  }

  // XP and levels
  const xpGain = clampInt(res.effects.xp, 0, XP_PER_TURN_MAX) + questXp;
  let leveledUp = false;
  if (xpGain > 0) {
    state.xp += xpGain;
    lines.push({ tone: "neutral", text: `+${xpGain} XP` });
    while (state.xp >= xpForLevel(state.level)) {
      state.xp -= xpForLevel(state.level);
      state.level += 1;
      state.unspentPoints += 1;
      state.fate = Math.min(FATE_MAX, state.fate + 1);
      const maxHp = maxHpFor(game.hero.stats, state.level);
      state.hp = Math.min(maxHp, state.hp + (maxHp - state.maxHp) + 4);
      state.maxHp = maxHp;
      leveledUp = true;
      lines.push({ tone: "level", text: `Level ${state.level}!` });
    }
  }

  // Codex
  const codex: CodexEntry[] = [...game.codex];
  for (const entry of res.codex.slice(0, 5)) {
    if (!entry.name?.trim() || !entry.summary?.trim()) continue;
    const idx = codex.findIndex((c) => sameName(c.name, entry.name));
    if (idx >= 0) codex[idx] = { ...codex[idx], kind: entry.kind, summary: entry.summary.trim() };
    else codex.push({ kind: entry.kind, name: entry.name.trim(), summary: entry.summary.trim(), firstSeenTurn: turn });
  }

  if (res.historyNote?.trim()) log.push({ id: uid(), kind: "note", turn, text: res.historyNote.trim() });
  if (lines.length) log.push({ id: uid(), kind: "effects", turn, lines });

  const over = state.hp <= 0;
  if (over) log.push({ id: uid(), kind: "system", turn, text: `${game.hero.name} has fallen.` });

  const chronicle = res.chronicle?.trim()
    ? [...game.chronicle, { turn, chapter, text: res.chronicle.trim() }]
    : game.chronicle;

  return {
    game: {
      ...game,
      updatedAt: Date.now(),
      state,
      quests,
      codex,
      chronicle,
      log: [...game.log, ...log],
      choices: over ? [] : sanitizeChoices(res.choices),
      scene: { ...game.scene, mood: res.scene.mood, prompt: res.scene.imagePrompt ?? game.scene.prompt },
      turn,
      chapter,
      over,
    },
    lines,
    leveledUp,
  };
}

export function sanitizeChoices(choices: Choice[]): Choice[] {
  return choices
    .filter((c) => c.label?.trim())
    .slice(0, 4)
    .map((c) => ({
      label: c.label.trim(),
      stat: c.stat && (STAT_KEYS as readonly string[]).includes(c.stat) ? c.stat : null,
      difficulty: c.difficulty in DIFFICULTY_DC ? c.difficulty : "moderate",
      risk: c.risk === "safe" || c.risk === "desperate" ? c.risk : "risky",
    }));
}

export function clampInt(n: unknown, min: number, max: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.min(max, Math.max(min, v));
}

function norm(s: string): string {
  return s.toLowerCase().replace(/^(a|an|the)\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function sameName(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

/** Exact name first, then a contained name ("key" matches "rusted iron key"). */
export function findItem(items: Item[], name: string): number {
  const n = norm(name);
  if (!n) return -1;
  const exact = items.findIndex((i) => norm(i.name) === n);
  if (exact >= 0) return exact;
  return items.findIndex((i) => norm(i.name).includes(n) || n.includes(norm(i.name)));
}

function cleanItem(item: Item): Item {
  return { name: item.name.trim().slice(0, 60), detail: (item.detail ?? "").trim().slice(0, 200), glyph: (item.glyph ?? "").trim().slice(0, 4) || "✦" };
}

function dedupeItems(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = norm(i.name ?? "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
