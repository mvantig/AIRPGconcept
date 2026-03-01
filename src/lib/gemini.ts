import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to your environment variables."
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export const IMAGE_STYLE_SUFFIX =
  ", in the style of a dark fantasy digital painting, highly detailed, dramatic lighting, rich colors, painterly textures";

export const HISTORICAL_IMAGE_STYLE_SUFFIX =
  ", in the style of a historically accurate oil painting, rich period details, authentic architecture and clothing, warm natural lighting, museum-quality illustration";

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash-lite";
export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";

const RETRY_DELAYS = [2000, 5000, 10000, 20000];

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRateLimitError(err) || attempt === RETRY_DELAYS.length) {
        throw err;
      }
      console.log(`Rate limited, retrying in ${RETRY_DELAYS[attempt]}ms (attempt ${attempt + 1}/${RETRY_DELAYS.length})...`);
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
  throw lastError;
}
