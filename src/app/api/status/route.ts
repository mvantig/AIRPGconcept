import { NextResponse } from "next/server";
import { narratorKind } from "@/lib/gm/narrator";
import { paintingAvailable } from "@/lib/gm/images";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ narrator: narratorKind(), painter: paintingAvailable() });
}
