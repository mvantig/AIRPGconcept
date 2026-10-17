import { NextResponse } from "next/server";
import { narratorAvailable } from "@/lib/gm/claude";
import { paintingAvailable } from "@/lib/gm/images";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ narrator: narratorAvailable() ? "claude" : "demo", painter: paintingAvailable() });
}
