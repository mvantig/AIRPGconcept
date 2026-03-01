import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameSessions = await prisma.gameSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      universe: true,
      gameMode: true,
      persona: true,
      gameState: true,
      imageUrl: true,
      saveType: true,
      label: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const parsed = gameSessions.map((gs) => {
    const persona = JSON.parse(gs.persona);
    const gameState = JSON.parse(gs.gameState);
    return {
      id: gs.id,
      universe: gs.universe,
      gameMode: gs.gameMode,
      personaName: persona.name,
      location: gameState.location,
      hp: gameState.hp,
      maxHp: gameState.maxHp,
      imageUrl: gs.imageUrl,
      saveType: gs.saveType,
      label: gs.label,
      createdAt: gs.createdAt,
      updatedAt: gs.updatedAt,
    };
  });

  return NextResponse.json({ sessions: parsed });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    sessionId,
    universe,
    gameMode,
    persona,
    gameState,
    chatHistory,
    storySummary,
    imageUrl,
    saveType = "auto",
    label,
  } = body;

  if (saveType === "auto" && sessionId) {
    const existing = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (existing) {
      const updated = await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          gameState: JSON.stringify(gameState),
          chatHistory: JSON.stringify(chatHistory),
          storySummary: storySummary || "",
          persona: JSON.stringify(persona),
          imageUrl: imageUrl || null,
        },
      });
      return NextResponse.json({ sessionId: updated.id });
    }
  }

  const created = await prisma.gameSession.create({
    data: {
      userId: session.user.id,
      universe,
      gameMode: gameMode || "fictional",
      persona: JSON.stringify(persona),
      gameState: JSON.stringify(gameState),
      chatHistory: JSON.stringify(chatHistory || []),
      storySummary: storySummary || "",
      imageUrl: imageUrl || null,
      saveType,
      label: label || null,
    },
  });

  return NextResponse.json({ sessionId: created.id });
}
