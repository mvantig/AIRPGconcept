import { describe, expect, it } from "vitest";
import type { TurnResolution } from "@/lib/types";
import { demoWorld } from "@/lib/gm/demo";
import { outcomeFor, oddsOf, rollCheck } from "./dice";
import { applyResolution, canReroll, heroFromDraft, newGame, normalizeStats, rerollWithFate, rollForChoice, spendStatPoint, xpForLevel } from "./rules";

const { world, heroes } = demoWorld("fiction", "lanterns", "mysterious");
const fresh = () => newGame(world, heroFromDraft(heroes[0]));
const fixed = (...values: number[]) => {
  let i = 0;
  return () => (values[i++ % values.length] - 1) / 20 + 0.001;
};

function resolution(patch: Partial<TurnResolution["effects"]> = {}, rest: Partial<TurnResolution> = {}): TurnResolution {
  return {
    narration: "Something happens.",
    chapterTitle: null,
    chronicle: "Something happened.",
    effects: { hpDelta: 0, goldDelta: 0, xp: 0, itemsGained: [], itemsLost: [], conditionsGained: [], conditionsLost: [], location: null, ...patch },
    quests: [],
    codex: [],
    scene: { imagePrompt: null, mood: "calm" },
    historyNote: null,
    choices: [{ label: "Go on", stat: "wits", difficulty: "moderate", risk: "safe" }],
    ...rest,
  };
}

describe("dice", () => {
  it("treats natural 20 and natural 1 as automatic", () => {
    expect(outcomeFor(20, 15, 30)).toBe("critical");
    expect(outcomeFor(1, 10, 2)).toBe("fumble");
  });
  it("gives a success at a cost when missing by three or less", () => {
    expect(outcomeFor(9, 12, 12)).toBe("success");
    expect(outcomeFor(8, 9, 12)).toBe("partial");
    expect(outcomeFor(8, 8, 12)).toBe("failure");
  });
  it("takes the higher die with advantage", () => {
    const roll = rollCheck({ stat: "might", statLabel: "Brawn", modifier: 1, dc: 12, advantage: "advantage", reason: "" }, fixed(4, 17));
    expect(roll.dice).toEqual([4, 17]);
    expect(roll.natural).toBe(17);
    expect(roll.total).toBe(18);
  });
  it("reports odds that rise with the modifier", () => {
    expect(oddsOf(3, 12)).toBeGreaterThan(oddsOf(0, 12));
    expect(oddsOf(0, 12)).toBeCloseTo(0.6);
  });
});

describe("heroes", () => {
  it("trims stats to the point budget", () => {
    const stats = normalizeStats({ might: 4, grace: 4, wits: 4, heart: 4 });
    expect(Object.values(stats).reduce((a, b) => a + b, 0)).toBe(5);
  });
  it("starts with full health and the starting kit", () => {
    const g = fresh();
    expect(g.state.hp).toBe(g.state.maxHp);
    expect(g.state.inventory.map((i) => i.name)).toContain("Guild Knife");
  });
});

describe("applyResolution", () => {
  it("clamps damage and ends the tale at zero health", () => {
    const g = fresh();
    const { game } = applyResolution(g, resolution({ hpDelta: -999 }), []);
    expect(game.state.hp).toBe(0);
    expect(game.over).toBe(true);
    expect(game.choices).toEqual([]);
  });
  it("never lets gold go negative", () => {
    const { game } = applyResolution(fresh(), resolution({ goldDelta: -500 }), []);
    expect(game.state.gold).toBe(0);
  });
  it("only removes items the hero actually carries, matching loosely", () => {
    const { game, lines } = applyResolution(fresh(), resolution({ itemsLost: ["the knife", "Excalibur"] }), []);
    expect(game.state.inventory.map((i) => i.name)).not.toContain("Guild Knife");
    expect(lines.filter((l) => l.text.startsWith("Lost"))).toHaveLength(1);
  });
  it("caps items gained per turn and skips duplicates", () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ name: `Gem ${i}`, detail: "", glyph: "💎" }));
    const { game } = applyResolution(fresh(), resolution({ itemsGained: [...items, { name: "guild knife", detail: "", glyph: "🗡️" }] }), []);
    expect(game.state.inventory).toHaveLength(3 + 4);
  });
  it("opens with a Prologue when the narrator gives no chapter title", () => {
    const { game } = applyResolution(fresh(), resolution(), []);
    expect(game.chapter).toBe(1);
    expect(game.log[0]).toMatchObject({ kind: "chapter", title: "Prologue" });
  });
  it("logs the action and roll before the narration", () => {
    const roll = rollCheck({ stat: "wits", statLabel: "Lore", modifier: 0, dc: 12, reason: "Read" }, fixed(15));
    const { game } = applyResolution(fresh(), resolution({}, { chapterTitle: "One" }), [roll], "Read the glass");
    expect(game.log.map((e) => e.kind)).toEqual(["action", "roll", "chapter", "narration"]);
  });
  it("pays out quest XP on completion and levels up", () => {
    let g = applyResolution(fresh(), resolution({}, { quests: [{ title: "Find her", objective: "x", status: "active", progress: 0, main: true }] }), []).game;
    expect(g.quests[0].main).toBe(true);
    const r = applyResolution(g, resolution({ xp: 20 }, { quests: [{ title: "find her", objective: "x", status: "completed", progress: 100, main: true }] }), []);
    g = r.game;
    expect(g.quests[0].status).toBe("completed");
    expect(r.leveledUp).toBe(true);
    expect(g.state.level).toBe(2);
    expect(g.state.xp).toBe(120 - xpForLevel(1));
    expect(g.state.unspentPoints).toBe(1);
  });
  it("upserts codex entries by name", () => {
    const a = applyResolution(fresh(), resolution({}, { codex: [{ kind: "character", name: "Wren", summary: "A lamplighter." }] }), []).game;
    const b = applyResolution(a, resolution({}, { codex: [{ kind: "character", name: "wren", summary: "A frightened lamplighter." }] }), []).game;
    expect(b.codex.filter((c) => c.name === "Wren")).toHaveLength(1);
    expect(b.codex.find((c) => c.name === "Wren")?.summary).toBe("A frightened lamplighter.");
  });
});

describe("fate and growth", () => {
  it("lets the hero reroll a failure once by spending fate", () => {
    const g = fresh();
    const choice = { label: "Leap", stat: "grace" as const, difficulty: "heroic" as const, risk: "desperate" as const };
    const failed = rollForChoice(g, choice, fixed(2))!;
    expect(failed.outcome).toBe("failure");
    expect(canReroll(g, failed)).toBe(true);
    const { game, roll } = rerollWithFate(g, failed, fixed(20));
    expect(game.state.fate).toBe(g.state.fate - 1);
    expect(roll.outcome).toBe("critical");
    expect(canReroll(game, roll)).toBe(false);
  });
  it("does not roll for trivial choices", () => {
    expect(rollForChoice(fresh(), { label: "Walk", stat: "might", difficulty: "trivial", risk: "safe" })).toBeNull();
  });
  it("spends level-up points and raises max health with might", () => {
    const g = { ...fresh() };
    g.state = { ...g.state, unspentPoints: 1 };
    const next = spendStatPoint(g, "might");
    expect(next.hero.stats.might).toBe(g.hero.stats.might + 1);
    expect(next.state.maxHp).toBe(g.state.maxHp + 2);
    expect(spendStatPoint(next, "might")).toBe(next);
  });
});
