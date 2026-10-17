import { ApiError, FinishReason, GoogleGenAI, ThinkingLevel, type Content, type Part } from "@google/genai";
import type { GameMode, HeroDraft, Tone, TurnEvent, TurnRequest, World } from "@/lib/types";
import { GM_RULES, turnContext, worldBible, worldPrompt } from "./prompts";
import { TURN_JSON_SCHEMA, WORLD_JSON_SCHEMA, parseTurn, parseWorld } from "./schema";
import { partialStringField } from "./partial";
import { NarratorError } from "./errors";
import { INVALID_ROLL, MAX_ROLLS_PER_TURN, NO_MORE_ROLLS, ROLL_INPUT_SCHEMA, ROLL_TOOL_DESCRIPTION, engineRoll, rollInput, rollResultText } from "./rolls";

// Gemini as narrator: the same prompts, schemas and roll_check tool as the Claude path.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const LEVELS: Record<string, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};
const TURN_THINKING = LEVELS[process.env.REALMWEAVER_EFFORT ?? ""] ?? ThinkingLevel.LOW;
const BLOCKED: string[] = [FinishReason.SAFETY, FinishReason.PROHIBITED_CONTENT, FinishReason.BLOCKLIST, FinishReason.SPII];

let client: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export function geminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function createGeminiWorld(mode: GameMode, seed: string, tone: Tone): Promise<{ world: World; heroes: HeroDraft[] }> {
  const response = await gemini().models.generateContent({
    model: MODEL,
    contents: worldPrompt(mode, seed, tone),
    config: {
      maxOutputTokens: 16000,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      responseMimeType: "application/json",
      responseJsonSchema: WORLD_JSON_SCHEMA,
    },
  });
  if (response.promptFeedback?.blockReason || BLOCKED.includes(response.candidates?.[0]?.finishReason ?? "")) {
    throw new NarratorError("The Weaver declined to build that world. Try a different seed.", false);
  }
  return parseWorld(JSON.parse(response.text ?? ""), { mode, seed, tone });
}

/** Run one turn: optional dice via function calls, then a streamed, structured resolution. */
export async function* runGeminiTurn({ game, action, roll }: TurnRequest): AsyncGenerator<TurnEvent> {
  const systemInstruction = `${GM_RULES}\n\n${worldBible(game.world)}`;
  const contents: Content[] = [{ role: "user", parts: [{ text: turnContext(game, action, roll) }] }];
  let rolls = roll ? 1 : 0;

  for (let iteration = 0; iteration < 4; iteration++) {
    const canRoll = rolls < MAX_ROLLS_PER_TURN && !roll && game.turn > 0;
    const stream = await gemini().models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 16000,
        thinkingConfig: { thinkingLevel: TURN_THINKING },
        responseMimeType: "application/json",
        responseJsonSchema: TURN_JSON_SCHEMA,
        ...(canRoll
          ? { tools: [{ functionDeclarations: [{ name: "roll_check", description: ROLL_TOOL_DESCRIPTION, parametersJsonSchema: ROLL_INPUT_SCHEMA }] }] }
          : {}),
      },
    });

    // Keep every part, thought signatures included: Gemini needs them back alongside function calls.
    const parts: Part[] = [];
    let json = "";
    let shown = "";
    let finish: string | undefined;
    for await (const chunk of stream) {
      if (chunk.promptFeedback?.blockReason) throw new NarratorError("The Weaver won't narrate that. Try a different action.", false);
      const candidate = chunk.candidates?.[0];
      if (candidate?.finishReason) finish = candidate.finishReason;
      for (const part of candidate?.content?.parts ?? []) {
        parts.push(part);
        if (part.text && !part.thought) {
          json += part.text;
          const narration = partialStringField(json, "narration");
          if (narration && narration.length - shown.length >= 12) {
            shown = narration;
            yield { type: "narration", text: narration };
          }
        }
      }
    }

    if (finish && BLOCKED.includes(finish)) throw new NarratorError("The Weaver won't narrate that. Try a different action.", false);

    const calls = parts.filter((p) => p.functionCall);
    if (calls.length) {
      contents.push({ role: "model", parts });
      const responses: Part[] = [];
      for (const { functionCall: call } of calls) {
        const parsed = rollInput.safeParse(call?.args);
        let result: string;
        if (call?.name !== "roll_check" || !parsed.success || rolls >= MAX_ROLLS_PER_TURN) {
          result = rolls >= MAX_ROLLS_PER_TURN ? NO_MORE_ROLLS : INVALID_ROLL;
        } else {
          rolls++;
          const rolled = engineRoll(game, parsed.data);
          yield { type: "roll", roll: rolled };
          result = rollResultText(rolled);
        }
        responses.push({ functionResponse: { id: call?.id, name: call?.name ?? "roll_check", response: { result } } });
      }
      contents.push({ role: "user", parts: responses });
      continue;
    }

    if (finish === FinishReason.MAX_TOKENS || !json.trim()) {
      throw new NarratorError("The Weaver lost the thread mid-sentence. Try again.", true);
    }
    yield { type: "resolution", resolution: parseTurn(JSON.parse(json)) };
    return;
  }
  throw new NarratorError("The Weaver couldn't settle on what happens. Try again.", true);
}

/** Gemini-specific errors; anything else returns null for the shared handler. */
export function describeGeminiError(err: unknown): { message: string; retryable: boolean } | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status === 400 && /api key/i.test(err.message)) return { message: "The Gemini API key was rejected. Check GEMINI_API_KEY.", retryable: false };
  if (err.status === 401 || err.status === 403) return { message: "The Gemini API key was rejected. Check GEMINI_API_KEY.", retryable: false };
  if (err.status === 404) return { message: `The Gemini model "${MODEL}" isn't available to this key. Check GEMINI_MODEL.`, retryable: false };
  if (err.status === 429) return { message: "The Weaver is catching their breath (rate limited). Try again in a moment.", retryable: true };
  return { message: `The Weaver stumbled (${err.status}). Try again.`, retryable: true };
}
