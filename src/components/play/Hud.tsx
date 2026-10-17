"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/types";
import { xpForLevel, FATE_MAX } from "@/lib/engine/rules";
import { Portrait } from "../Art";
import { IconBook, IconCoin, IconCompass, IconFlame, IconHome, IconMute, IconSpeaker } from "../Icons";

interface Props {
  game: Game;
  speaking: boolean;
  onToggleSpeech: () => void;
  onJournal: (tab?: JournalTab) => void;
  onExit: () => void;
}

export type JournalTab = "hero" | "pack" | "quests" | "codex" | "chronicle" | "gallery";

export function Hud({ game, speaking, onToggleSpeech, onJournal, onExit }: Props) {
  const { state, hero } = game;
  const hpPct = (state.hp / state.maxHp) * 100;
  const xpPct = (state.xp / xpForLevel(state.level)) * 100;
  const main = game.quests.find((q) => q.main && q.status === "active") ?? game.quests.find((q) => q.status === "active");

  // Shake the HP bar when the hero gets hurt.
  const [hurt, setHurt] = useState(0);
  const lastHp = useRef(state.hp);
  useEffect(() => {
    if (state.hp < lastHp.current) setHurt((n) => n + 1);
    lastHp.current = state.hp;
  }, [state.hp]);

  const hpColor = hpPct > 50 ? "var(--color-good)" : hpPct > 25 ? "var(--color-quest)" : "var(--color-bad)";

  return (
    <header className="border-b border-[var(--line)] bg-[var(--ink)]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => onJournal("hero")} className="relative" aria-label="Open hero sheet">
          <Portrait imageId={hero.portrait} name={hero.name} size={44} />
          <span className="absolute -right-1 -bottom-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--ink)] px-1 text-[10px] font-bold text-[var(--accent)] ring-1 ring-[var(--accent)]">
            {state.level}
          </span>
          {state.unspentPoints > 0 && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-quest)]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-[family-name:var(--font-display)] text-lg leading-none">{hero.name}</span>
            <span className="hidden truncate text-xs text-faint sm:inline">{hero.epithet}</span>
          </div>
          <div key={hurt} className={`mt-1.5 flex items-center gap-2 ${hurt ? "anim-hurt" : ""}`}>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/8" role="meter" aria-label="Health" aria-valuenow={state.hp} aria-valuemin={0} aria-valuemax={state.maxHp}>
              <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out" style={{ width: `${hpPct}%`, background: hpColor, boxShadow: `0 0 12px ${hpColor}` }} />
            </div>
            <span className="text-xs text-muted tabular-nums">
              {state.hp}/{state.maxHp}
            </span>
          </div>
          <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/5" title={`${state.xp} / ${xpForLevel(state.level)} XP`}>
            <div className="h-full bg-[var(--accent)]/70 transition-[width] duration-700" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className="hidden items-center gap-3 text-sm sm:flex">
          <span className="flex items-center gap-0.5" title={`${state.fate} fate: reroll a failed check`} aria-label={`${state.fate} fate points`}>
            {Array.from({ length: FATE_MAX }, (_, i) => (
              <IconFlame key={i} size={15} className={i < state.fate ? "text-[var(--accent)]" : "text-white/15"} />
            ))}
          </span>
          <span className="flex items-center gap-1 text-muted tabular-nums" title={game.world.currency}>
            <IconCoin size={15} className="text-[var(--color-quest)]" />
            {state.gold}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="icon-btn" onClick={onToggleSpeech} title={speaking ? "Stop reading aloud" : "Read the story aloud"} aria-pressed={speaking}>
            {speaking ? <IconSpeaker size={16} /> : <IconMute size={16} />}
          </button>
          <button className="icon-btn" onClick={() => onJournal()} title="Journal (J)" aria-label="Open journal">
            <IconBook size={16} />
          </button>
          <button className="icon-btn" onClick={onExit} title="Back to the library" aria-label="Back to the library">
            <IconHome size={16} />
          </button>
        </div>
      </div>

      {main && (
        <button onClick={() => onJournal("quests")} className="mt-3 flex w-full items-center gap-2 text-left text-xs" title={main.objective}>
          <IconCompass size={14} className="shrink-0 text-[var(--accent2)]" />
          <span className="truncate font-semibold text-parchment/90">{main.title}</span>
          <span className="hidden truncate text-faint md:inline">— {main.objective}</span>
          <span className="ml-auto h-1 w-16 shrink-0 overflow-hidden rounded-full bg-white/8">
            <span className="block h-full bg-[var(--accent2)] transition-[width] duration-700" style={{ width: `${main.progress}%` }} />
          </span>
        </button>
      )}
    </header>
  );
}
