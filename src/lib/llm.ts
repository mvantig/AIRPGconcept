import Groq from "groq-sdk";
import { getGeminiClient, TEXT_MODEL, withRetry } from "./gemini";

type ContentItem =
  | string
  | { role: "user" | "model"; parts: { text: string }[] }[];

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set. Add it to your .env.local file.");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function getProvider(): "groq" | "gemini" {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new Error("No LLM API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env.local");
}

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function generateText(contents: ContentItem): Promise<string> {
  const provider = getProvider();

  if (provider === "groq") {
    return generateWithGroq(contents);
  }
  return generateWithGemini(contents);
}

async function generateWithGroq(contents: ContentItem): Promise<string> {
  const groq = getGroqClient();

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

  if (typeof contents === "string") {
    messages.push({ role: "user", content: contents });
  } else {
    for (const item of contents) {
      const role = item.role === "model" ? "assistant" as const : "user" as const;
      const text = item.parts.map((p) => p.text).join("\n");
      messages.push({ role, content: text });
    }
  }

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.8,
    max_tokens: 2048,
  });

  return response.choices[0]?.message?.content ?? "";
}

async function generateWithGemini(contents: ContentItem): Promise<string> {
  const ai = getGeminiClient();
  const result = await withRetry(() =>
    ai.models.generateContent({ model: TEXT_MODEL, contents })
  );
  return result.text ?? "";
}
