import { describe, expect, it } from "vitest";
import { partialStringField } from "./partial";
import { parseTurn, parseWorld } from "./schema";

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
  it("fills in palette and stat names when the world comes back thin", () => {
    const { world, heroes } = parseWorld({ title: "X", palette: { accent: "red" }, heroes: [{ name: "A" }] }, { mode: "fiction", seed: "x", tone: "grim" });
    expect(world.palette.accent).toMatch(/^#/);
    expect(world.statLabels.might).toBe("Might");
    expect(heroes[0].stats).toBeTruthy();
  });
});
