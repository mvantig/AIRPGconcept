import { createStore, del, get, set } from "idb-keyval";
import type { Game } from "@/lib/types";

// Saves live in the browser (IndexedDB): no account needed, and images fit where localStorage would overflow.

export interface SaveMeta {
  id: string;
  title: string;
  hero: string;
  epithet: string;
  chapter: number;
  turn: number;
  level: number;
  location: string;
  portrait?: string;
  accent: string;
  updatedAt: number;
  over: boolean;
}

const SNAPSHOT_LIMIT = 12;
let store: ReturnType<typeof createStore> | null = null;
const db = () => (store ??= createStore("realmweaver", "kv"));

export async function listSaves(): Promise<SaveMeta[]> {
  const metas = ((await get<SaveMeta[]>("saves", db())) ?? []).slice();
  return metas.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadGame(id: string): Promise<Game | undefined> {
  return get<Game>(`game:${id}`, db());
}

export async function saveGame(game: Game): Promise<void> {
  await set(`game:${game.id}`, game, db());
  const metas = (await get<SaveMeta[]>("saves", db())) ?? [];
  const meta: SaveMeta = {
    id: game.id,
    title: game.world.title,
    hero: game.hero.name,
    epithet: game.hero.epithet,
    chapter: game.chapter,
    turn: game.turn,
    level: game.state.level,
    location: game.state.location.name,
    portrait: game.hero.portrait,
    accent: game.world.palette.accent,
    updatedAt: game.updatedAt,
    over: game.over,
  };
  await set("saves", [meta, ...metas.filter((m) => m.id !== game.id)], db());
}

export async function deleteGame(id: string): Promise<void> {
  const game = await loadGame(id);
  const images = new Set<string>([...(game?.gallery.map((g) => g.imageId) ?? []), ...(game?.hero.portrait ? [game.hero.portrait] : [])]);
  await Promise.all([...images].map((img) => del(`img:${img}`, db())));
  await del(`game:${id}`, db());
  await del(`snap:${id}`, db());
  const metas = (await get<SaveMeta[]>("saves", db())) ?? [];
  await set("saves", metas.filter((m) => m.id !== id), db());
}

/** Snapshots of the game before each turn, for "rewind". Newest last. */
export async function loadSnapshots(id: string): Promise<Game[]> {
  return (await get<Game[]>(`snap:${id}`, db())) ?? [];
}

export async function saveSnapshots(id: string, snaps: Game[]): Promise<void> {
  await set(`snap:${id}`, snaps.slice(-SNAPSHOT_LIMIT), db());
}

export async function putImage(id: string, dataUrl: string): Promise<void> {
  await set(`img:${id}`, dataUrl, db());
}

export async function getImage(id: string): Promise<string | undefined> {
  return get<string>(`img:${id}`, db());
}

export interface TaleFile {
  format: "realmweaver-tale";
  version: 2;
  game: Game;
  images: Record<string, string>;
}

export async function exportTale(id: string): Promise<Blob | null> {
  const game = await loadGame(id);
  if (!game) return null;
  const ids = new Set([...game.gallery.map((g) => g.imageId), ...(game.hero.portrait ? [game.hero.portrait] : [])]);
  const images: Record<string, string> = {};
  for (const img of ids) {
    const data = await getImage(img);
    if (data) images[img] = data;
  }
  const file: TaleFile = { format: "realmweaver-tale", version: 2, game, images };
  return new Blob([JSON.stringify(file)], { type: "application/json" });
}

export async function importTale(text: string): Promise<Game> {
  const file = JSON.parse(text) as TaleFile;
  if (file?.format !== "realmweaver-tale" || !file.game?.id || !file.game.world) throw new Error("That file isn't a Realmweaver tale.");
  for (const [img, data] of Object.entries(file.images ?? {})) {
    if (typeof data === "string" && data.startsWith("data:image/")) await putImage(img, data);
  }
  const game = { ...file.game, updatedAt: Date.now() };
  await saveGame(game);
  return game;
}
