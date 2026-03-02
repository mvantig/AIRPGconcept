import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const gameSession = await prisma.gameSession.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!gameSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const persona = JSON.parse(gameSession.persona);
  if (gameSession.imageStyle) {
    persona.imageStyle = gameSession.imageStyle;
  }

  return NextResponse.json({
    id: gameSession.id,
    universe: gameSession.universe,
    gameMode: gameSession.gameMode,
    persona,
    gameState: JSON.parse(gameSession.gameState),
    chatHistory: JSON.parse(gameSession.chatHistory),
    storySummary: gameSession.storySummary,
    imageUrl: gameSession.imageUrl,
    imageStyle: gameSession.imageStyle,
    currentGoal: gameSession.currentGoal ? JSON.parse(gameSession.currentGoal) : null,
    updatedAt: gameSession.updatedAt,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const gameSession = await prisma.gameSession.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!gameSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.gameSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
