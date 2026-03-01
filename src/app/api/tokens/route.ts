import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTokenBalance } from "@/lib/tokens";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await getTokenBalance(session.user.id);
  return NextResponse.json({ tokens });
}
