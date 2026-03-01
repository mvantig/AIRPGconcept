import { prisma } from "@/lib/db";

export interface TokenResult {
  success: boolean;
  remaining: number;
  error?: string;
}

export async function deductTokens(
  userId: string,
  cost: number
): Promise<TokenResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokens: true },
  });

  if (!user) {
    return { success: false, remaining: 0, error: "User not found" };
  }

  if (user.tokens < cost) {
    return {
      success: false,
      remaining: user.tokens,
      error: `Not enough tokens. You have ${user.tokens} but this action costs ${cost}.`,
    };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { tokens: { decrement: cost } },
    select: { tokens: true },
  });

  return { success: true, remaining: updated.tokens };
}

export async function getTokenBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokens: true },
  });
  return user?.tokens ?? 0;
}
