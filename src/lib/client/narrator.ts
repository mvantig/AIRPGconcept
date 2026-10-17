import type { Game, GameMode, HeroDraft, Roll, Tone, TurnEvent, World } from "@/lib/types";

export interface Status {
  narrator: "claude" | "demo";
  painter: boolean;
}

export async function fetchStatus(): Promise<Status> {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    return (await res.json()) as Status;
  } catch {
    return { narrator: "demo", painter: false };
  }
}

export async function weaveWorld(mode: GameMode, seed: string, tone: Tone): Promise<{ world: World; heroes: HeroDraft[]; demo: boolean }> {
  const res = await fetch("/api/world", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, seed, tone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "The Weaver couldn't build that world. Try again.");
  return data;
}

/** POST a turn and yield the server-sent events as they arrive. */
export async function* streamTurn(game: Game, action: string, roll: Roll | null, signal?: AbortSignal): AsyncGenerator<TurnEvent> {
  const res = await fetch("/api/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Images and the full log stay on the device; the narrator only needs the text.
    body: JSON.stringify({ game: { ...game, log: game.log.slice(-60) }, action, roll }),
    signal,
  });
  if (!res.ok || !res.body) {
    yield { type: "error", message: "Couldn't reach the Weaver. Try again.", retryable: true };
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (line) yield JSON.parse(line.slice(6)) as TurnEvent;
    }
  }
}

export async function requestPainting(kind: "scene" | "portrait", world: World, prompt: string, name = ""): Promise<string | null> {
  try {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, world, prompt, name }),
    });
    const data = await res.json();
    return typeof data.image === "string" ? data.image : null;
  } catch {
    return null;
  }
}
