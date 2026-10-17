"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Choice, Game, Roll, StatKey, TurnResolution } from "@/lib/types";
import { applyResolution, canReroll, rerollWithFate, rollForChoice, spendStatPoint, uid } from "@/lib/engine/rules";
import { loadSnapshots, putImage, saveGame, saveSnapshots } from "@/lib/client/saves";
import { requestPainting, streamTurn } from "@/lib/client/narrator";

export type Phase = "idle" | "rolling" | "deciding" | "narrating" | "error";

export interface Pending {
  action: string;
  roll: Roll | null;
}

const OPENING = "Begin the story. Open on the situation described in the world's opening.";

/** All the turn orchestration for the play screen: dice, streaming, rules, saving, rewinding and painting. */
export function useTale(initial: Game, painter: boolean) {
  const [game, setGame] = useState(initial);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<Pending | null>(null);
  const [liveRolls, setLiveRolls] = useState<Roll[]>([]);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [painting, setPainting] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [snapshots, setSnapshots] = useState<Game[]>([]);
  const [lastNarration, setLastNarration] = useState<{ turn: number; text: string } | null>(null);

  const gameRef = useRef(game);
  const abortRef = useRef<AbortController | null>(null);
  const portraitRef = useRef(false);
  const snapshotsRef = useRef<Game[]>([]);

  const commit = useCallback((next: Game) => {
    gameRef.current = next;
    setGame(next);
    void saveGame(next);
  }, []);

  useEffect(() => {
    loadSnapshots(initial.id).then((snaps) => {
      snapshotsRef.current = snaps;
      setSnapshots(snaps);
    });
    return () => abortRef.current?.abort();
  }, [initial.id]);

  const paintScene = useCallback(
    async (prompt: string, turn: number) => {
      if (!painter) return;
      setPainting(true);
      const image = await requestPainting("scene", gameRef.current.world, prompt);
      setPainting(false);
      if (!image) return;
      const imageId = uid();
      await putImage(imageId, image);
      const g = gameRef.current;
      commit({
        ...g,
        scene: g.turn === turn ? { ...g.scene, imageId } : g.scene,
        gallery: [...g.gallery, { imageId, caption: g.state.location.name, turn }],
      });
    },
    [commit, painter],
  );

  const paintPortrait = useCallback(async () => {
    const g = gameRef.current;
    if (!painter || g.hero.portrait) return;
    const image = await requestPainting("portrait", g.world, g.hero.look, g.hero.name);
    if (!image) return;
    const imageId = uid();
    await putImage(imageId, image);
    const latest = gameRef.current;
    commit({ ...latest, hero: { ...latest.hero, portrait: imageId } });
  }, [commit, painter]);

  const narrate = useCallback(
    async (action: string, roll: Roll | null, opening = false) => {
      const before = gameRef.current;
      setPhase("narrating");
      setError(null);
      setStreamText("");
      setLiveRolls([]);
      setPending({ action, roll });
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      const rolls: Roll[] = roll ? [roll] : [];
      let resolution: TurnResolution | null = null;
      try {
        for await (const event of streamTurn(before, action, roll, abort.signal)) {
          if (event.type === "narration") setStreamText(event.text);
          else if (event.type === "roll") {
            rolls.push(event.roll);
            setLiveRolls([...rolls]);
          } else if (event.type === "resolution") resolution = event.resolution;
          else if (event.type === "error") {
            setError({ message: event.message, retryable: event.retryable });
            setPhase("error");
            return;
          }
        }
      } catch (err) {
        if (abort.signal.aborted) return;
        console.error(err);
        setError({ message: "Lost the connection to the Weaver. Try again.", retryable: true });
        setPhase("error");
        return;
      }
      if (!resolution) {
        setError({ message: "The Weaver went quiet. Try again.", retryable: true });
        setPhase("error");
        return;
      }

      const applied = applyResolution(before, resolution, rolls, opening ? undefined : action);
      if (!opening) {
        const nextSnaps = [...snapshotsRef.current, before].slice(-12);
        snapshotsRef.current = nextSnaps;
        setSnapshots(nextSnaps);
        void saveSnapshots(before.id, nextSnaps);
      }
      commit(applied.game);
      setLastNarration({ turn: applied.game.turn, text: resolution.narration });
      setPending(null);
      setStreamText("");
      setLiveRolls([]);
      setPhase("idle");
      if (applied.leveledUp) setLevelUp(true);
      if (resolution.scene.imagePrompt) void paintScene(resolution.scene.imagePrompt, applied.game.turn);
    },
    [commit, paintScene],
  );

  // Open the story automatically the first time a tale is played. Unmounting aborts the
  // request (React's dev double-mount does this too), so the next mount asks again;
  // the portrait is only ever requested once.
  useEffect(() => {
    if (initial.turn !== 0 || initial.log.length !== 0) return;
    if (!portraitRef.current) {
      portraitRef.current = true;
      void paintPortrait();
    }
    if (gameRef.current.turn === 0) void narrate(OPENING, null, true);
  }, [initial, narrate, paintPortrait]);

  const choose = useCallback(
    (choice: Choice) => {
      if (phase !== "idle") return;
      const roll = rollForChoice(gameRef.current, choice);
      if (!roll) return void narrate(choice.label, null);
      setPending({ action: choice.label, roll });
      setPhase("rolling");
      setTimeout(() => {
        if (canReroll(gameRef.current, roll)) setPhase("deciding");
        else void narrate(choice.label, roll);
      }, 1500);
    },
    [narrate, phase],
  );

  const freeAction = useCallback(
    (text: string) => {
      if (phase !== "idle" || !text.trim()) return;
      void narrate(text.trim(), null);
    },
    [narrate, phase],
  );

  const acceptRoll = useCallback(() => {
    if (phase !== "deciding" || !pending) return;
    void narrate(pending.action, pending.roll);
  }, [narrate, pending, phase]);

  const reroll = useCallback(() => {
    if (phase !== "deciding" || !pending?.roll) return;
    const { game: next, roll } = rerollWithFate(gameRef.current, pending.roll);
    commit(next);
    setPending({ action: pending.action, roll });
    setPhase("rolling");
    setTimeout(() => void narrate(pending.action, roll), 1500);
  }, [commit, narrate, pending, phase]);

  const retry = useCallback(() => {
    if (!pending) return;
    const opening = gameRef.current.turn === 0;
    void narrate(pending.action, pending.roll, opening);
  }, [narrate, pending]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPending(null);
    setError(null);
    setStreamText("");
    setPhase("idle");
  }, []);

  const rewind = useCallback(() => {
    if (phase !== "idle" && phase !== "error") return;
    const prev = snapshotsRef.current.at(-1);
    if (!prev) return;
    const rest = snapshotsRef.current.slice(0, -1);
    snapshotsRef.current = rest;
    setSnapshots(rest);
    void saveSnapshots(prev.id, rest);
    // Keep paintings and the portrait made since: they're still part of the book.
    const cur = gameRef.current;
    commit({ ...prev, hero: { ...prev.hero, portrait: cur.hero.portrait ?? prev.hero.portrait }, gallery: cur.gallery, updatedAt: Date.now() });
    setPending(null);
    setError(null);
    setPhase("idle");
  }, [commit, phase]);

  const raiseStat = useCallback(
    (stat: StatKey) => {
      const next = spendStatPoint(gameRef.current, stat);
      commit(next);
      if (next.state.unspentPoints <= 0) setLevelUp(false);
    },
    [commit],
  );

  return {
    game,
    phase,
    pending,
    liveRolls,
    streamText,
    error,
    painting,
    levelUp,
    lastNarration,
    canRewind: snapshots.length > 0,
    choose,
    freeAction,
    acceptRoll,
    reroll,
    retry,
    cancel,
    rewind,
    raiseStat,
    dismissLevelUp: () => setLevelUp(false),
  };
}
