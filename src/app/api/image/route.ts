import { NextResponse } from "next/server";
import { z } from "zod";
import { paint, paintingAvailable } from "@/lib/gm/images";
import { portraitPrompt, scenePrompt } from "@/lib/gm/prompts";
import type { World } from "@/lib/types";

export const maxDuration = 90;

const body = z.object({
  kind: z.enum(["scene", "portrait"]),
  world: z.object({ artStyle: z.string() }).passthrough(),
  prompt: z.string().max(1200).default(""),
  name: z.string().max(80).default(""),
});

export async function POST(request: Request) {
  if (!paintingAvailable()) return NextResponse.json({ image: null, reason: "disabled" });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ image: null, reason: "bad-request" }, { status: 400 });
  const { kind, prompt, name } = parsed.data;
  const world = parsed.data.world as unknown as World;
  try {
    const image =
      kind === "portrait" ? await paint(portraitPrompt(world, prompt, name), "3:4") : await paint(scenePrompt(world, prompt), "16:9");
    return NextResponse.json({ image, reason: image ? null : "empty" });
  } catch (err) {
    console.error("image", err);
    return NextResponse.json({ image: null, reason: "failed" });
  }
}
