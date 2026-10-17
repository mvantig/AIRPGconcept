"use client";

import { useCallback, useEffect, useState } from "react";
import type { Game, GameMode, HeroDraft, Tone, World } from "@/lib/types";
import { heroFromDraft, newGame } from "@/lib/engine/rules";
import { DEFAULT_PALETTE } from "@/lib/gm/schema";
import { fetchStatus, weaveWorld, type Status } from "@/lib/client/narrator";
import { deleteGame, exportTale, importTale, listSaves, loadGame, saveGame, type SaveMeta } from "@/lib/client/saves";
import { themeVars } from "@/lib/client/theme";
import { HeroScreen } from "./HeroScreen";
import { LoomScreen } from "./LoomScreen";
import { PlayScreen } from "./play/PlayScreen";
import { TitleScreen } from "./TitleScreen";
import { WeavingScreen } from "./WeavingScreen";

type Screen =
  | { name: "title" }
  | { name: "loom" }
  | { name: "weaving"; seed: string }
  | { name: "heroes"; world: World; heroes: HeroDraft[]; demo: boolean }
  | { name: "play"; game: Game };

export default function Realmweaver() {
  const [screen, setScreen] = useState<Screen>({ name: "title" });
  const [saves, setSaves] = useState<SaveMeta[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => listSaves().then(setSaves).catch(() => setSaves([])), []);

  useEffect(() => {
    void refresh();
    fetchStatus().then(setStatus);
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const palette =
    screen.name === "heroes" ? screen.world.palette : screen.name === "play" ? screen.game.world.palette : DEFAULT_PALETTE;

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", palette.ink);
  }, [palette.ink]);

  const weave = async (mode: GameMode, seed: string, tone: Tone) => {
    setError(null);
    setScreen({ name: "weaving", seed });
    try {
      const { world, heroes, demo } = await weaveWorld(mode, seed, tone);
      setScreen({ name: "heroes", world, heroes, demo });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The Weaver couldn't build that world.");
      setScreen({ name: "loom" });
    }
  };

  const begin = async (world: World, draft: HeroDraft) => {
    const game = newGame(world, heroFromDraft(draft));
    await saveGame(game);
    setScreen({ name: "play", game });
  };

  const open = async (id: string) => {
    const game = await loadGame(id);
    if (game) setScreen({ name: "play", game });
    else setToast("That tale couldn't be found.");
  };

  const exit = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setScreen({ name: "title" });
    void refresh();
  };

  const download = async (id: string) => {
    const blob = await exportTale(id);
    if (!blob) return;
    const meta = saves.find((s) => s.id === id);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(meta?.title ?? "tale").replace(/[^\w]+/g, "-").toLowerCase()}.realmweaver.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const upload = async (file: File) => {
    try {
      const game = await importTale(await file.text());
      await refresh();
      setToast(`Imported “${game.world.title}”.`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "That file couldn't be imported.");
    }
  };

  return (
    <div style={themeVars(palette)} className="min-h-dvh bg-[var(--ink)] transition-colors duration-1000">
      {screen.name === "title" && (
        <TitleScreen
          saves={saves}
          status={status}
          onNew={() => {
            setError(null);
            setScreen({ name: "loom" });
          }}
          onContinue={open}
          onDelete={async (id) => {
            await deleteGame(id);
            await refresh();
          }}
          onExport={download}
          onImport={upload}
        />
      )}
      {screen.name === "loom" && <LoomScreen status={status} error={error} onBack={() => setScreen({ name: "title" })} onWeave={weave} />}
      {screen.name === "weaving" && <WeavingScreen seed={screen.seed} />}
      {screen.name === "heroes" && (
        <HeroScreen
          world={screen.world}
          heroes={screen.heroes}
          demo={screen.demo}
          onBack={() => setScreen({ name: "loom" })}
          onBegin={(hero) => begin(screen.world, hero)}
        />
      )}
      {screen.name === "play" && <PlayScreen key={screen.game.id} initial={screen.game} painter={!!status?.painter} onExit={exit} />}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line)] bg-[var(--ink-3)] px-5 py-2.5 text-sm shadow-xl anim-rise" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
