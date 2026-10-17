"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { EffectLine, Game, LogEntry, Roll } from "@/lib/types";
import type { Pending, Phase } from "./useTale";
import { Prose } from "./Prose";
import { RollChip } from "./Dice";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
export const roman = (n: number) => ROMAN[n] ?? String(n);

const TONE_CLASS: Record<EffectLine["tone"], string> = {
  good: "border-[var(--color-good)]/30 text-[var(--color-good)] bg-[var(--color-good)]/8",
  bad: "border-[var(--color-bad)]/30 text-[var(--color-bad)] bg-[var(--color-bad)]/8",
  neutral: "border-[var(--line)] text-muted",
  quest: "border-[var(--color-quest)]/35 text-[var(--color-quest)] bg-[var(--color-quest)]/8",
  level: "border-[var(--accent)] text-[var(--ink)] bg-[var(--accent)] font-semibold",
};

interface Props {
  game: Game;
  phase: Phase;
  pending: Pending | null;
  liveRolls: Roll[];
  streamText: string;
  footer?: ReactNode;
}

export function StoryLog({ game, phase, pending, liveRolls, streamText, footer }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Follow the story while it's being written, and land on the end of each finished turn.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [game.turn, streamText, liveRolls.length, phase]);

  // Opening a saved tale starts at the latest page, not the first.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, []);

  let dropCapNext = false;
  const showPendingAction = pending && game.turn > 0 && (phase === "narrating" || phase === "error");

  return (
    <div ref={scrollerRef} className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-5 sm:px-8" aria-live="polite">
      <div className="mx-auto max-w-[38rem] space-y-6 py-8">
        {game.log.map((entry) => {
          const node = renderEntry(entry, dropCapNext, game);
          dropCapNext = entry.kind === "chapter";
          return node;
        })}

        {showPendingAction && <ActionLine text={pending.action} />}
        {phase === "narrating" &&
          liveRolls.concat(pending?.roll && !liveRolls.includes(pending.roll) ? [pending.roll] : []).map((r, i) => <RollChip key={i} roll={r} />)}
        {phase === "narrating" &&
          (streamText ? (
            <Prose text={streamText} streaming dropCap={game.turn === 0} />
          ) : (
            <div className="flex items-center gap-3 text-sm text-faint">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </span>
              {game.turn === 0 ? "The Weaver is setting the scene…" : "The Weaver considers…"}
            </div>
          ))}
        {phase === "idle" && footer}
        <div ref={endRef} className="h-2" />
      </div>
    </div>
  );
}

function ActionLine({ text }: { text: string }) {
  return (
    <div className="flex justify-end anim-rise">
      <p className="max-w-[85%] rounded-2xl rounded-br-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-2.5 text-[0.95rem] text-parchment">
        {text}
      </p>
    </div>
  );
}

function renderEntry(entry: LogEntry, dropCap: boolean, game: Game) {
  switch (entry.kind) {
    case "chapter":
      return (
        <header key={entry.id} className="pt-6 pb-2 text-center anim-rise">
          <div className="flex items-center justify-center gap-3 text-[var(--accent)]">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--accent)]" />
            <span className="eyebrow !text-[var(--accent)]">Chapter {roman(entry.chapter)}</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--accent)]" />
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight italic">{entry.title}</h2>
        </header>
      );
    case "narration":
      return (
        <div key={entry.id} className="anim-fade">
          <Prose text={entry.text} dropCap={dropCap} />
        </div>
      );
    case "action":
      return <ActionLine key={entry.id} text={entry.text} />;
    case "roll":
      return <RollChip key={entry.id} roll={entry.roll} />;
    case "effects":
      return (
        <ul key={entry.id} className="flex flex-wrap gap-2" aria-label="What changed">
          {entry.lines.map((l, i) => (
            <li key={i} className={`rounded-full border px-3 py-1 text-xs anim-pop ${TONE_CLASS[l.tone]}`} style={{ animationDelay: `${i * 90}ms` }}>
              {l.text}
            </li>
          ))}
        </ul>
      );
    case "note":
      return (
        <aside key={entry.id} className="rounded-2xl border-l-2 border-[var(--accent2)] bg-[var(--accent2-soft)] px-4 py-3 anim-rise">
          <div className="eyebrow !text-[var(--accent2)]">{game.world.mode === "history" ? "From the archives" : "Lore"}</div>
          <p className="mt-1 font-[family-name:var(--font-serif)] text-[0.95rem] leading-relaxed text-parchment/90">{entry.text}</p>
        </aside>
      );
    case "system":
      return (
        <p key={entry.id} className="text-center font-[family-name:var(--font-display)] text-xl text-[var(--color-bad)] italic">
          {entry.text}
        </p>
      );
  }
}
