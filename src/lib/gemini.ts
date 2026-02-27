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

export const TEXT_MODEL = "gemini-2.0-flash";
export const IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";
