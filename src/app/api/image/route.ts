import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGeminiClient, IMAGE_MODEL, IMAGE_STYLE_SUFFIX, HISTORICAL_IMAGE_STYLE_SUFFIX, withRetry } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, gameMode } = await request.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set — image generation disabled", imageUrl: null },
        { status: 200 }
      );
    }

    const styleSuffix = gameMode === "historical" ? HISTORICAL_IMAGE_STYLE_SUFFIX : IMAGE_STYLE_SUFFIX;
    const styledPrompt = prompt + styleSuffix;
    const ai = getGeminiClient();

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: styledPrompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          thinkingConfig: { thinkingBudget: 0 },
        },
      })
    );

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType ?? "image/png";
        const dataUrl = `data:${mimeType};base64,${base64}`;
        return NextResponse.json({ imageUrl: dataUrl });
      }
    }

    return NextResponse.json(
      { error: "No image generated", imageUrl: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("Image API error:", error);
    const raw = error instanceof Error ? error.message : String(error);

    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
      return NextResponse.json(
        { error: "Image generation rate limited.", imageUrl: null },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: raw, imageUrl: null }, { status: 500 });
  }
}
