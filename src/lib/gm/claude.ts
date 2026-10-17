import Anthropic from "@anthropic-ai/sdk";
import type { GameMode, HeroDraft, Tone, TurnEvent, TurnRequest, World } from "@/lib/types";
import { GM_RULES, turnContext, worldBible, worldPrompt } from "./prompts";
import { TURN_JSON_SCHEMA, WORLD_JSON_SCHEMA, parseTurn, parseWorld } from "./schema";
import { partialStringField } from "./partial";
import { NarratorError } from "./errors";
import { INVALID_ROLL, MAX_ROLLS_PER_TURN, NO_MORE_ROLLS, ROLL_INPUT_SCHEMA, ROLL_TOOL_DESCRIPTION, engineRoll, rollInput, rollResultText } from "./rolls";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

const MODEL = process.env.REALMWEAVER_MODEL || "claude-opus-5-5";
const TURN_EFFORT = (process.env.REALMWEAVER_EFFORT as Effort | undefined) || "low";
// Server-side fallback reroutes a request a safety classifier declines to a model that can serve it.
const BETAS: Anthropic.Beta.AnthropicBeta[] = ["server-side-fallback-2026-07-01"];

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export function claudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function createClaudeWorld(
  mode: GameMode,
  seed: string,
  tone: Tone,
): Promise<{ world: World; heroes: HeroDraft[] }> {
  const stream = anthropic().beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: WORLD_JSON_SCHEMA } },
    messages: [{ role: "user", content: worldPrompt(mode, seed, tone) }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new NarratorError("The Weaver declined to build that world. Try a different seed.", false);
  const text = textOf(message.content);
  return parseWorld(JSON.parse(text), { mode, seed, tone });
}

const ROLL_TOOL: Anthropic.Beta.BetaTool = {
  name: "roll_check",
  description: ROLL_TOOL_DESCRIPTION,
  strict: true,
  eager_input_streaming: true,
  input_schema: ROLL_INPUT_SCHEMA as unknown as Anthropic.Beta.BetaTool["input_schema"],
};

/** Run one turn: optional dice via tool calls, then a streamed, structured resolution. */
export async function* runClaudeTurn({ game, action, roll }: TurnRequest): AsyncGenerator<TurnEvent> {
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: GM_RULES },
    { type: "text", text: worldBible(game.world), cache_control: { type: "ephemeral" } },
  ];
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: turnContext(game, action, roll) }];
  let rolls = roll ? 1 : 0;

  for (let iteration = 0; iteration < 4; iteration++) {
    const canRoll = rolls < MAX_ROLLS_PER_TURN && !roll && game.turn > 0;
    const stream = anthropic().beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: BETAS,
      fallbacks: "default",
      system,
      messages,
      thinking: { type: "adaptive" },
      output_config: { effort: TURN_EFFORT, format: { type: "json_schema", schema: TURN_JSON_SCHEMA } },
      ...(canRoll ? { tools: [ROLL_TOOL] } : {}),
    });

    let json = "";
    let shown = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        json += event.delta.text;
        const narration = partialStringField(json, "narration");
        if (narration && narration.length - shown.length >= 12) {
          shown = narration;
          yield { type: "narration", text: narration };
        }
      }
    }

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.APIError) throw err;
      continue; // a tool input that never became valid JSON: ask again
    }

    if (message.stop_reason === "refusal") {
      throw new NarratorError("The Weaver won't narrate that. Try a different action.", false);
    }

    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (message.stop_reason === "tool_use" && toolUses.length) {
      messages.push({ role: "assistant", content: message.content as Anthropic.Beta.BetaContentBlockParam[] });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const parsed = rollInput.safeParse(use.input);
        if (use.name !== "roll_check" || !parsed.success || rolls >= MAX_ROLLS_PER_TURN) {
          results.push({
            type: "tool_result",
            tool_use_id: use.id,
            is_error: true,
            content: rolls >= MAX_ROLLS_PER_TURN ? NO_MORE_ROLLS : INVALID_ROLL,
          });
          continue;
        }
        rolls++;
        const result = engineRoll(game, parsed.data);
        yield { type: "roll", roll: result };
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: rollResultText(result),
        });
      }
      messages.push({ role: "user", content: results });
      continue;
    }

    const text = textOf(message.content);
    if (message.stop_reason === "max_tokens" || !text) {
      throw new NarratorError("The Weaver lost the thread mid-sentence. Try again.", true);
    }
    yield { type: "resolution", resolution: parseTurn(JSON.parse(text)) };
    return;
  }
  throw new NarratorError("The Weaver couldn't settle on what happens. Try again.", true);
}

function textOf(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Claude-specific errors; anything else returns null for the shared handler. */
export function describeClaudeError(err: unknown): { message: string; retryable: boolean } | null {
  if (err instanceof Anthropic.AuthenticationError) return { message: "The Claude API key was rejected. Check ANTHROPIC_API_KEY.", retryable: false };
  if (err instanceof Anthropic.RateLimitError) return { message: "The Weaver is catching their breath (rate limited). Try again in a moment.", retryable: true };
  if (err instanceof Anthropic.APIConnectionError) return { message: "Couldn't reach the Weaver. Check your connection and try again.", retryable: true };
  if (err instanceof Anthropic.APIError) return { message: `The Weaver stumbled (${err.status ?? "error"}). Try again.`, retryable: true };
  return null;
}
