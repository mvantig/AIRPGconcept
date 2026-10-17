import type { TurnEvent, TurnRequest } from "@/lib/types";
import { describeError, narratorKind, runTurn } from "@/lib/gm/narrator";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = (await request.json().catch(() => null)) as TurnRequest | null;
  if (!req?.game || typeof req.action !== "string" || !req.action.trim()) {
    return new Response("Bad request", { status: 400 });
  }
  const turn: TurnRequest = { game: req.game, action: req.action.trim().slice(0, 500), roll: req.roll ?? null };
  const source = runTurn(narratorKind(), turn);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TurnEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        for await (const event of source) {
          if (request.signal.aborted) break;
          send(event);
        }
        send({ type: "done" });
      } catch (err) {
        console.error("turn", err);
        send({ type: "error", ...describeError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
