import { NextResponse } from "next/server";
import { z } from "zod";
import { createWorld, describeError, narratorAvailable } from "@/lib/gm/claude";
import { demoWorld } from "@/lib/gm/demo";

export const maxDuration = 120;

const body = z.object({
  mode: z.enum(["fiction", "history"]),
  seed: z.string().trim().min(2).max(600),
  tone: z.enum(["heroic", "grim", "whimsical", "mysterious"]),
});

export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Describe your world in a few words first." }, { status: 400 });
  const { mode, seed, tone } = parsed.data;

  if (!narratorAvailable()) {
    await new Promise((r) => setTimeout(r, 1800));
    return NextResponse.json({ ...demoWorld(mode, seed, tone), demo: true });
  }
  try {
    const result = await createWorld(mode, seed, tone);
    if (result.heroes.length === 0) throw new SyntaxError("no heroes");
    return NextResponse.json({ ...result, demo: false });
  } catch (err) {
    console.error("world", err);
    const { message } = describeError(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
