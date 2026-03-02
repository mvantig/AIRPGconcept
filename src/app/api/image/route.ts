import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deductTokens } from "@/lib/tokens";
import { getGeminiClient, IMAGE_MODEL, withRetry } from "@/lib/gemini";

const IMAGE_TOKEN_COST = 3;
const FALLBACK_STYLE = "highly detailed digital painting, dramatic lighting, rich colors";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, imageStyle } = await request.json();
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

    const tokenResult = await deductTokens(session.user.id, IMAGE_TOKEN_COST);
    if (!tokenResult.success) {
      return NextResponse.json(
        { error: tokenResult.error, imageUrl: null, tokensRemaining: tokenResult.remaining },
        { status: 403 }
      );
    }

    const style = imageStyle || FALLBACK_STYLE;
    const styledPrompt = `${prompt}, rendered in the style of: ${style}`;
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
        return NextResponse.json({
          imageUrl: dataUrl,
          tokensRemaining: tokenResult.remaining,
        });
      }
    }

    return NextResponse.json(
      { error: "No image generated", imageUrl: null, tokensRemaining: tokenResult.remaining },
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
