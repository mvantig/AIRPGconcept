import { z } from "zod";
import type { Roll, TurnRequest } from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { DIFFICULTY_DC, OUTCOME_LABEL, rollCheck } from "@/lib/engine/dice";

// The roll_check tool both narrators can call. The engine rolls; the model only asks.

export const MAX_ROLLS_PER_TURN = 2;

export const ROLL_TOOL_DESCRIPTION =
  "Roll a d20 check for an uncertain action with stakes. The engine adds the hero's stat modifier and compares against the difficulty. Use advantage when the hero has a clear edge (the right tool, surprise, help) and disadvantage when hampered (wounded, outnumbered, a condition applies). Returns the result, which you must honor in the narration.";

export const ROLL_INPUT_SCHEMA = {
  type: "object",
  properties: {
    stat: { type: "string", enum: [...STAT_KEYS], description: "might, grace, wits or heart" },
    difficulty: { type: "string", enum: ["easy", "moderate", "hard", "heroic"] },
    advantage: { type: "string", enum: ["none", "advantage", "disadvantage"] },
    reason: { type: "string", description: "Short description of what is being attempted, shown to the player." },
  },
  required: ["stat", "difficulty", "advantage", "reason"],
  additionalProperties: false,
} as const;

export const rollInput = z.object({
  stat: z.enum(STAT_KEYS),
  difficulty: z.enum(["easy", "moderate", "hard", "heroic"]),
  advantage: z.enum(["none", "advantage", "disadvantage"]),
  reason: z.string(),
});

export function engineRoll(game: TurnRequest["game"], input: z.infer<typeof rollInput>): Roll {
  return rollCheck({
    stat: input.stat,
    statLabel: game.world.statLabels[input.stat],
    modifier: game.hero.stats[input.stat],
    dc: DIFFICULTY_DC[input.difficulty],
    advantage: input.advantage,
    reason: input.reason,
  });
}

export function rollResultText(r: Roll): string {
  return `${r.statLabel} ${r.modifier >= 0 ? "+" : ""}${r.modifier} vs ${r.dc}: rolled ${r.dice.join(" & ")} → ${r.total}. ${OUTCOME_LABEL[r.outcome].toUpperCase()}.`;
}

export const NO_MORE_ROLLS = "No more checks this turn. Narrate with what you have.";
export const INVALID_ROLL = "Invalid check request.";
