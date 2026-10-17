import { GoogleGenAI } from "@google/genai";

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";

let client: GoogleGenAI | null = null;

export function paintingAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Returns a data URL, or null when the model painted nothing. */
export async function paint(prompt: string, aspectRatio: "16:9" | "3:4"): Promise<string | null> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } },
  });
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`;
  }
  return null;
}
