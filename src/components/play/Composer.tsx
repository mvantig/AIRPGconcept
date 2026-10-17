"use client";

import { useEffect, useRef, useState } from "react";
import type { Choice, Game } from "@/lib/types";
import { DIFFICULTY_DC, oddsOf } from "@/lib/engine/dice";
import { fmtMod } from "@/lib/gm/prompts";
import { DiceRoll } from "./Dice";
import type { Pending, Phase } from "./useTale";
import { IconFlame, IconSend, IconUndo } from "../Icons";

const RISK_COLOR = { safe: "var(--color-good)", risky: "var(--color-quest)", desperate: "var(--color-bad)" } as const;

interface Props {
  game: Game;
  phase: Phase;
  pending: Pending | null;
  error: { message: string; retryable: boolean } | null;
  canRewind: boolean;
  onChoose: (c: Choice) => void;
  onFree: (text: string) => void;
  onAccept: () => void;
  onReroll: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onRewind: () => void;
  onExit: () => void;
}

export function Composer(props: Props) {
  const { game, phase, pending, error, onChoose, onFree, onAccept, onReroll } = props;
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const idle = phase === "idle" && !game.over;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = document.activeElement === inputRef.current;
      if (idle && !typing && /^[1-4]$/.test(e.key)) {
        const c = game.choices[Number(e.key) - 1];
        if (c) {
          e.preventDefault();
          onChoose(c);
        }
      } else if (idle && !typing && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (phase === "deciding" && e.key === "Enter") {
        e.preventDefault();
        onAccept();
      } else if (phase === "deciding" && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onReroll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.choices, idle, onAccept, onChoose, onReroll, phase]);

  if (game.over) return <Fallen {...props} />;

  return (
    <div className="border-t border-[var(--line)] bg-[var(--ink)]/85 px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-[38rem]">
        {(phase === "rolling" || phase === "deciding") && pending?.roll && (
          <div className="panel p-4">
            <DiceRoll roll={pending.roll} />
            {phase === "deciding" && (
              <div className="mt-4 flex flex-wrap gap-2 anim-rise">
                <button className="btn btn-primary px-5 py-2.5 text-sm" onClick={onReroll}>
                  <IconFlame size={16} /> Spend fate to reroll ({game.state.fate} left)
                </button>
                <button className="btn btn-ghost px-5 py-2.5 text-sm" onClick={onAccept}>
                  Accept fate
                </button>
                <span className="self-center text-xs text-faint">F to reroll · Enter to accept</span>
              </div>
            )}
          </div>
        )}

        {phase === "error" && error && (
          <div className="panel flex flex-wrap items-center gap-3 border-[var(--color-bad)]/40 p-4">
            <p className="min-w-0 flex-1 text-sm text-[var(--color-bad)]">{error.message}</p>
            {error.retryable && (
              <button className="btn btn-primary px-4 py-2 text-sm" onClick={props.onRetry}>
                Try again
              </button>
            )}
            <button className="btn btn-ghost px-4 py-2 text-sm" onClick={props.onCancel}>
              Do something else
            </button>
          </div>
        )}

        {phase === "narrating" && (
          <p className="py-2 text-center text-sm text-faint">
            <span className="shimmer rounded px-2 py-1">The story is being written…</span>
          </p>
        )}

        {idle && (
          <>
            <ChoiceList game={game} onChoose={onChoose} className="hidden lg:block" />
            <form
              className="flex items-center gap-2 lg:mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                onFree(text);
                setText("");
              }}
            >
              {props.canRewind && (
                <button type="button" className="icon-btn shrink-0" title="Rewind the last turn" aria-label="Rewind the last turn" onClick={props.onRewind}>
                  <IconUndo size={16} />
                </button>
              )}
              <input
                ref={inputRef}
                className="field min-w-0 flex-1 rounded-full px-5 py-3 font-[family-name:var(--font-serif)]"
                placeholder={game.choices.length ? "Or describe what you do…" : "What do you do?"}
                value={text}
                maxLength={500}
                onChange={(e) => setText(e.target.value)}
                aria-label="Describe your action"
              />
              <button type="submit" className="btn btn-primary h-12 w-12 shrink-0 !p-0" disabled={!text.trim()} aria-label="Act">
                <IconSend size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/** On large screens the choices sit above the input; on phones they flow at the end of the story. */
export function ChoiceList({ game, onChoose, className = "" }: { game: Game; onChoose: (c: Choice) => void; className?: string }) {
  if (!game.choices.length || game.over) return null;
  return (
    <ol className={`space-y-2 ${className}`} aria-label="What do you do?">
      {game.choices.map((c, i) => (
        <li key={`${game.turn}-${i}`} className="anim-rise" style={{ animationDelay: `${i * 70}ms` }}>
          <ChoiceButton choice={c} index={i} game={game} onClick={() => onChoose(c)} />
        </li>
      ))}
    </ol>
  );
}

function ChoiceButton({ choice, index, game, onClick }: { choice: Choice; index: number; game: Game; onClick: () => void }) {
  const checked = choice.stat && choice.difficulty !== "trivial";
  const mod = choice.stat ? game.hero.stats[choice.stat] : 0;
  const odds = checked ? Math.round(oddsOf(mod, DIFFICULTY_DC[choice.difficulty]) * 100) : null;
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/[0.025] px-3 py-2.5 text-left transition hover:-translate-y-px hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
    >
      <kbd className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] font-[family-name:var(--font-ui)] text-xs text-muted transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
        {index + 1}
      </kbd>
      <span className="min-w-0 flex-1 font-[family-name:var(--font-serif)] text-[1rem] leading-snug">{choice.label}</span>
      <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
        {checked && choice.stat ? (
          <span className="hidden sm:inline">
            {game.world.statLabels[choice.stat]} {fmtMod(mod)}
          </span>
        ) : null}
        {odds !== null ? (
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 tabular-nums" title="Chance of success (including success at a cost)">
            {odds}%
          </span>
        ) : (
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5">sure</span>
        )}
        <span className="h-2 w-2 rounded-full" style={{ background: RISK_COLOR[choice.risk] }} title={`${choice.risk} approach`} />
      </span>
    </button>
  );
}

function Fallen({ game, canRewind, onRewind, onExit }: Props) {
  return (
    <div className="border-t border-[var(--line)] bg-black/60 px-6 pt-8 pb-[max(env(safe-area-inset-bottom),2rem)] text-center backdrop-blur-xl anim-rise">
      <p className="eyebrow !text-[var(--color-bad)]">The tale ends here</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl italic">{game.hero.name} has fallen.</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Level {game.state.level}, {game.chronicle.length} deeds in the chronicle. Every tale can be rewound one page at a time.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        {canRewind && (
          <button className="btn btn-primary px-5 py-2.5 text-sm" onClick={onRewind}>
            <IconUndo size={16} /> Rewind the last turn
          </button>
        )}
        <button className="btn btn-ghost px-5 py-2.5 text-sm" onClick={onExit}>
          Back to the library
        </button>
      </div>
    </div>
  );
}
