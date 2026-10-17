import type { Difficulty, Outcome, Roll, StatKey } from "@/lib/types";

export type Rng = () => number;

export const DIFFICULTY_DC: Record<Difficulty, number> = {
  trivial: 6,
  easy: 9,
  moderate: 12,
  hard: 15,
  heroic: 18,
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  critical: "Critical success",
  success: "Success",
  partial: "Success at a cost",
  failure: "Failure",
  fumble: "Critical failure",
};

export function d20(rng: Rng = Math.random): number {
  return Math.floor(rng() * 20) + 1;
}

/** Natural 20 and natural 1 always win and lose. Missing by 3 or less is a success at a cost. */
export function outcomeFor(natural: number, total: number, dc: number): Outcome {
  if (natural === 20) return "critical";
  if (natural === 1) return "fumble";
  if (total >= dc) return "success";
  if (total >= dc - 3) return "partial";
  return "failure";
}

export function isSuccess(outcome: Outcome): boolean {
  return outcome === "critical" || outcome === "success" || outcome === "partial";
}

export interface CheckInput {
  stat: StatKey;
  statLabel: string;
  modifier: number;
  dc: number;
  advantage?: Roll["advantage"];
  reason: string;
}

export function rollCheck(input: CheckInput, rng: Rng = Math.random): Roll {
  const advantage = input.advantage ?? "none";
  const dice = advantage === "none" ? [d20(rng)] : [d20(rng), d20(rng)];
  const natural =
    advantage === "advantage" ? Math.max(...dice) : advantage === "disadvantage" ? Math.min(...dice) : dice[0];
  const total = natural + input.modifier;
  return {
    stat: input.stat,
    statLabel: input.statLabel,
    modifier: input.modifier,
    dc: input.dc,
    dice,
    natural,
    total,
    outcome: outcomeFor(natural, total, input.dc),
    advantage,
    reason: input.reason,
  };
}

/** Chance (0..1) of at least a success at a cost, used for the odds shown on choices. */
export function oddsOf(modifier: number, dc: number): number {
  let hits = 0;
  for (let natural = 1; natural <= 20; natural++) {
    if (isSuccess(outcomeFor(natural, natural + modifier, dc))) hits++;
  }
  return hits / 20;
}
