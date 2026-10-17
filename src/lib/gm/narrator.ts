import type { GameMode, HeroDraft, Tone, TurnEvent, TurnRequest, World } from "@/lib/types";
import { claudeAvailable, createClaudeWorld, describeClaudeError, runClaudeTurn } from "./claude";
import { createGeminiWorld, describeGeminiError, geminiAvailable, runGeminiTurn } from "./gemini";
import { runDemoTurn } from "./demo";
import { NarratorError } from "./errors";

export type NarratorKind = "claude" | "gemini" | "demo";

/**
 * REALMWEAVER_NARRATOR picks explicitly. Otherwise Claude narrates when its key is set,
 * then Gemini, and the hand-written demo runs when neither is.
 */
export function narratorKind(): NarratorKind {
  const wanted = process.env.REALMWEAVER_NARRATOR?.toLowerCase();
  if (wanted === "claude" && claudeAvailable()) return "claude";
  if (wanted === "gemini" && geminiAvailable()) return "gemini";
  if (wanted === "demo") return "demo";
  if (claudeAvailable()) return "claude";
  if (geminiAvailable()) return "gemini";
  return "demo";
}

export function createWorld(kind: Exclude<NarratorKind, "demo">, mode: GameMode, seed: string, tone: Tone): Promise<{ world: World; heroes: HeroDraft[] }> {
  return kind === "gemini" ? createGeminiWorld(mode, seed, tone) : createClaudeWorld(mode, seed, tone);
}

export function runTurn(kind: NarratorKind, req: TurnRequest): AsyncGenerator<TurnEvent> {
  if (kind === "claude") return runClaudeTurn(req);
  if (kind === "gemini") return runGeminiTurn(req);
  return runDemoTurn(req);
}

export function describeError(err: unknown): { message: string; retryable: boolean } {
  if (err instanceof NarratorError) return { message: err.message, retryable: err.retryable };
  const specific = describeClaudeError(err) ?? describeGeminiError(err);
  if (specific) return specific;
  if (err instanceof SyntaxError) return { message: "The Weaver's answer came back garbled. Try again.", retryable: true };
  return { message: "Something went wrong. Try again.", retryable: true };
}
