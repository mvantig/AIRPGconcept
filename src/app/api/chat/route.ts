import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateText } from "@/lib/llm";
import {
  buildPersonaGenerationPrompt,
  buildPersonaModificationPrompt,
  buildGameSystemPrompt,
  buildSummaryPrompt,
} from "@/lib/prompts";
import type { ChatApiRequest, ChatApiResponse } from "@/types/game";

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    return text.slice(braceStart, braceEnd + 1);
  }
  return text.trim();
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ChatApiRequest;
    const { phase, messages, gameState, persona, universe, storySummary, userInput } = body;

    if (phase === "persona_generate") {
      const prompt = buildPersonaGenerationPrompt(universe);
      const text = await generateText(prompt);
      const jsonStr = extractJSON(text);
      const personaData = JSON.parse(jsonStr);

      return NextResponse.json({
        narrative: `I've created a character for the "${universe}" universe. Meet **${personaData.name}**!`,
        persona: personaData,
      } as ChatApiResponse);
    }

    if (phase === "persona_modify") {
      const currentPersonaJson = JSON.stringify({
        name: persona.name,
        backstory: persona.backstory,
        stats: persona.stats,
      });
      const prompt = buildPersonaModificationPrompt(
        universe,
        currentPersonaJson,
        userInput ?? ""
      );
      const text = await generateText(prompt);
      const jsonStr = extractJSON(text);
      const personaData = JSON.parse(jsonStr);

      return NextResponse.json({
        narrative: `Character updated! Here's the revised **${personaData.name}**.`,
        persona: personaData,
      } as ChatApiResponse);
    }

    if (phase === "game_turn") {
      const systemPrompt = buildGameSystemPrompt(
        universe,
        persona,
        gameState,
        storySummary
      );

      const last5 = messages.slice(-5);
      const conversationParts = last5.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

      const allContents = [
        { role: "user" as const, parts: [{ text: systemPrompt }] },
        ...conversationParts,
      ];

      if (userInput) {
        allContents.push({
          role: "user" as const,
          parts: [{ text: userInput }],
        });
      }

      const text = await generateText(allContents);
      const jsonStr = extractJSON(text);
      const parsed = JSON.parse(jsonStr);

      let newSummary = storySummary;
      if (messages.length > 0 && messages.length % 6 === 0) {
        try {
          const summaryText = await generateText(
            buildSummaryPrompt(storySummary, last5)
          );
          newSummary = summaryText || storySummary;
        } catch {
          // Keep existing summary on failure
        }
      }

      return NextResponse.json({
        narrative: parsed.narrative,
        stateUpdates: parsed.state_updates,
        imagePrompt: parsed.image_prompt,
        storySummary: newSummary,
      } as ChatApiResponse);
    }

    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  } catch (error) {
    console.error("Chat API error:", error);
    const raw = error instanceof Error ? error.message : String(error);

    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota") || raw.includes("rate_limit")) {
      return NextResponse.json(
        {
          error:
            "API rate limit reached. Wait a minute and try again.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: raw }, { status: 500 });
  }
}
