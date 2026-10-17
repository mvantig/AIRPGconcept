import { afterEach, describe, expect, it, vi } from "vitest";
import { partialStringField } from "./partial";
import { parseTurn, parseWorld } from "./schema";
import { narratorKind } from "./narrator";

describe("partialStringField", () => {
  it("returns null until the field starts", () => {
    expect(partialStringField('{"chapterTitle": null, "narr', "narration")).toBeNull();
  });
  it("decodes escapes in an unfinished string", () => {
    expect(partialStringField('{"narration": "Rain \\"falls\\".\\n\\nThe la', "narration")).toBe('Rain "falls".\n\nThe la');
  });
  it("stops at a dangling escape or unicode sequence", () => {
    expect(partialStringField('{"narration":"caf\\u00e', "narration")).toBe("caf");
    expect(partialStringField('{"narration":"end\\', "narration")).toBe("end");
  });
  it("returns the whole value once closed", () => {
    expect(partialStringField('{"narration":"done","x":"y"}', "narration")).toBe("done");
  });
});

describe("lenient parsers", () => {
  it("repairs a turn with missing and malformed fields", () => {
    const t = parseTurn({ narration: "Hi", effects: { hpDelta: "lots" }, choices: [{ label: "Run", stat: "speed", difficulty: "hard", risk: "risky" }] });
    expect(t.effects.hpDelta).toBe(0);
    expect(t.effects.itemsGained).toEqual([]);
    expect(t.choices[0].stat).toBeNull();
    expect(t.scene.mood).toBe("calm");
  });
  it("drops a chapter number the narrator put in the title", () => {
    expect(parseTurn({ chapterTitle: "Chapter IV: The Long Night" }).chapterTitle).toBe("The Long Night");
    expect(parseTurn({ chapterTitle: "Chapter 2 - Ash" }).chapterTitle).toBe("Ash");
    expect(parseTurn({ chapterTitle: "Chapterhouse Rising" }).chapterTitle).toBe("Chapterhouse Rising");
  });
  it("fills in palette and stat names when the world comes back thin", () => {
    const { world, heroes } = parseWorld({ title: "X", palette: { accent: "red" }, heroes: [{ name: "A" }] }, { mode: "fiction", seed: "x", tone: "grim" });
    expect(world.palette.accent).toMatch(/^#/);
    expect(world.statLabels.might).toBe("Might");
    expect(heroes[0].stats).toBeTruthy();
  });
});

describe("narratorKind", () => {
  afterEach(() => vi.unstubAllEnvs());
  const keys = (anthropic: string, gemini: string, pick = "") => {
    vi.stubEnv("ANTHROPIC_API_KEY", anthropic);
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "");
    vi.stubEnv("GEMINI_API_KEY", gemini);
    vi.stubEnv("REALMWEAVER_NARRATOR", pick);
  };
  it("prefers Claude, then Gemini, then the demo", () => {
    keys("a", "g");
    expect(narratorKind()).toBe("claude");
    keys("", "g");
    expect(narratorKind()).toBe("gemini");
    keys("", "");
    expect(narratorKind()).toBe("demo");
  });
  it("follows REALMWEAVER_NARRATOR when that narrator has a key", () => {
    keys("a", "g", "gemini");
    expect(narratorKind()).toBe("gemini");
    keys("", "g", "claude");
    expect(narratorKind()).toBe("gemini");
  });
});
