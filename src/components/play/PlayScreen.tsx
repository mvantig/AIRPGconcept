"use client";

import { useCallback, useEffect, useState } from "react";
import type { Game, StatKey } from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { STAT_MAX } from "@/lib/engine/rules";
import { fmtMod } from "@/lib/gm/prompts";
import { MOOD_TINT } from "@/lib/client/theme";
import { SceneView } from "../Art";
import { ChoiceList, Composer } from "./Composer";
import { Hud, type JournalTab } from "./Hud";
import { Journal } from "./Journal";
import { StoryLog, roman } from "./StoryLog";
import { useTale } from "./useTale";

const SPEECH_KEY = "realmweaver:speech";

export function PlayScreen({ initial, painter, onExit }: { initial: Game; painter: boolean; onExit: () => void }) {
  const tale = useTale(initial, painter);
  const { game } = tale;
  const [journal, setJournal] = useState<{ open: boolean; tab: JournalTab }>({ open: false, tab: "hero" });
  const speech = useSpeech();

  const openJournal = useCallback((tab?: JournalTab) => setJournal((j) => ({ open: true, tab: tab ?? j.tab })), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key.toLowerCase() === "j") setJournal((j) => ({ ...j, open: !j.open }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { speak } = speech;
  useEffect(() => {
    if (tale.lastNarration) speak(tale.lastNarration.text);
  }, [tale.lastNarration, speak]);

  const chapterTitle = [...game.log].reverse().find((e) => e.kind === "chapter");

  return (
    <div className="grain flex h-dvh flex-col overflow-hidden lg:flex-row">
      <section className="relative h-[26dvh] shrink-0 sm:h-[34dvh] lg:h-full lg:flex-1" aria-label="Scene">
        <SceneView imageId={game.scene.imageId} palette={game.world.palette} seed={`${game.world.title}:${game.state.location.name}`} mood={game.scene.mood} painting={tale.painting} />
        <div className="pointer-events-none absolute inset-0 transition-colors duration-[2000ms]" style={{ background: MOOD_TINT[game.scene.mood], mixBlendMode: "soft-light" }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-black/30 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[var(--ink)]/70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pt-16 pb-4 sm:p-8 lg:pt-32">
          <div key={`${game.chapter}-${game.state.location.name}`} className="anim-rise">
            {chapterTitle?.kind === "chapter" && (
              <div className="eyebrow !text-[var(--accent)]">
                Chapter {roman(chapterTitle.chapter)} · {chapterTitle.title}
              </div>
            )}
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-[1.7rem] leading-tight drop-shadow-lg sm:text-5xl">{game.state.location.name}</h1>
            <p className="mt-1 hidden max-w-xl font-[family-name:var(--font-serif)] text-parchment/80 italic sm:block">{game.state.location.detail}</p>
          </div>
        </div>
        <div className="absolute top-4 left-4 hidden rounded-full border border-[var(--line)] bg-black/40 px-3 py-1.5 font-[family-name:var(--font-display)] text-sm backdrop-blur lg:block">
          {game.world.title}
        </div>
      </section>

      <section className="relative flex min-h-0 flex-1 flex-col border-[var(--line)] bg-[var(--ink)] lg:w-[min(48vw,700px)] lg:flex-none lg:border-l">
        <Hud game={game} speaking={speech.enabled} onToggleSpeech={speech.toggle} onJournal={openJournal} onExit={onExit} />
        <StoryLog
          game={game}
          phase={tale.phase}
          pending={tale.pending}
          liveRolls={tale.liveRolls}
          streamText={tale.streamText}
          footer={<ChoiceList game={game} onChoose={tale.choose} className="pt-2 lg:hidden" />}
        />
        <Composer
          game={game}
          phase={tale.phase}
          pending={tale.pending}
          error={tale.error}
          canRewind={tale.canRewind}
          onChoose={tale.choose}
          onFree={tale.freeAction}
          onAccept={tale.acceptRoll}
          onReroll={tale.reroll}
          onRetry={tale.retry}
          onCancel={tale.cancel}
          onRewind={tale.rewind}
          onExit={onExit}
        />
      </section>

      <Journal game={game} open={journal.open} tab={journal.tab} onTab={(tab) => setJournal({ open: true, tab })} onClose={() => setJournal((j) => ({ ...j, open: false }))} onRaise={tale.raiseStat} />
      {tale.levelUp && game.state.unspentPoints > 0 && <LevelUp game={game} onRaise={tale.raiseStat} onLater={tale.dismissLevelUp} />}
    </div>
  );
}

function LevelUp({ game, onRaise, onLater }: { game: Game; onRaise: (s: StatKey) => void; onLater: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm anim-fade" role="dialog" aria-modal="true" aria-label="Level up">
      <div className="panel w-full max-w-md bg-[var(--ink-2)] p-7 text-center anim-pop">
        <div className="eyebrow !text-[var(--accent)]">Level up</div>
        <div className="mt-2 font-[family-name:var(--font-display)] text-5xl">Level {game.state.level}</div>
        <p className="mt-3 text-sm text-muted">Your health grows and a point of fate returns. Where have you grown stronger?</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          {STAT_KEYS.map((k) => (
            <button key={k} className="btn btn-ghost flex-col !gap-0 rounded-2xl px-4 py-3" disabled={game.hero.stats[k] >= STAT_MAX} onClick={() => onRaise(k)}>
              <span>{game.world.statLabels[k]}</span>
              <span className="text-xs font-normal text-muted tabular-nums">
                {fmtMod(game.hero.stats[k])} → {fmtMod(game.hero.stats[k] + 1)}
              </span>
            </button>
          ))}
        </div>
        <button className="mt-4 text-sm text-faint hover:text-parchment" onClick={onLater}>
          Decide later
        </button>
      </div>
    </div>
  );
}

/** Optional read-aloud using the browser's own voices. */
function useSpeech() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(SPEECH_KEY) === "1");
    } catch {}
  }, []);
  const speak = useCallback(
    (text: string) => {
      if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[*_]/g, ""));
      u.rate = 0.98;
      u.pitch = 0.95;
      window.speechSynthesis.speak(u);
    },
    [enabled],
  );
  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on;
      try {
        localStorage.setItem(SPEECH_KEY, next ? "1" : "0");
      } catch {}
      if (!next && "speechSynthesis" in window) window.speechSynthesis.cancel();
      return next;
    });
  }, []);
  return { enabled, speak, toggle };
}
