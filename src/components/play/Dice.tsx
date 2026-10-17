"use client";

import { useEffect, useState } from "react";
import type { Outcome, Roll } from "@/lib/types";
import { OUTCOME_LABEL } from "@/lib/engine/dice";
import { fmtMod } from "@/lib/gm/prompts";

export const OUTCOME_COLOR: Record<Outcome, string> = {
  critical: "var(--color-quest)",
  success: "var(--color-good)",
  partial: "var(--accent2)",
  failure: "var(--color-bad)",
  fumble: "var(--color-bad)",
};

function D20({ value, color, spinning, size = 72 }: { value: number | string; color: string; spinning?: boolean; size?: number }) {
  return (
    <div className={`relative grid shrink-0 place-items-center ${spinning ? "anim-tumble" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="rgba(255,255,255,0.04)" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="50,22 76,64 24,64" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" strokeLinejoin="round" />
        <path d="M50,4 50,22 M92,28 76,64 M8,28 24,64 M50,96 76,64 M50,96 24,64 M92,72 76,64 M8,72 24,64 M92,28 50,22 M8,28 50,22" stroke={color} strokeWidth="1" opacity="0.35" />
      </svg>
      <span className="relative font-[family-name:var(--font-display)] font-semibold tabular-nums" style={{ fontSize: size * 0.3, color }}>
        {value}
      </span>
    </div>
  );
}

/** The big roll shown while the dice are in the air. */
export function DiceRoll({ roll, settledDelay = 1100 }: { roll: Roll; settledDelay?: number }) {
  const [face, setFace] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setSettled(false);
    const tick = setInterval(() => setFace(Math.floor(Math.random() * 20) + 1), 70);
    const stop = setTimeout(() => {
      clearInterval(tick);
      setSettled(true);
    }, settledDelay);
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
  }, [roll, settledDelay]);

  const color = settled ? OUTCOME_COLOR[roll.outcome] : "var(--accent)";
  return (
    <div className="flex items-center gap-5" aria-live="polite">
      <D20 key={`${roll.total}-${roll.rerolled}`} value={settled ? roll.natural : (face ?? "")} color={color} spinning size={84} />
      <div className="min-w-0">
        <div className="eyebrow">
          {roll.statLabel} {fmtMod(roll.modifier)} · needs {roll.dc}
          {roll.advantage !== "none" && <span className="ml-1 normal-case tracking-normal">({roll.advantage})</span>}
        </div>
        {settled ? (
          <div className="anim-pop">
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl" style={{ color }}>
              {OUTCOME_LABEL[roll.outcome]}
            </div>
            <div className="text-sm text-muted tabular-nums">
              {roll.dice.length > 1 ? `${roll.dice.join(" & ")} → ${roll.natural}` : roll.natural} {fmtMod(roll.modifier)} = {roll.total}
              {roll.rerolled && " · rerolled with fate"}
            </div>
          </div>
        ) : (
          <div className="mt-1 font-[family-name:var(--font-display)] text-2xl text-muted">Rolling…</div>
        )}
      </div>
    </div>
  );
}

/** A finished roll, as it sits in the story log. */
export function RollChip({ roll }: { roll: Roll }) {
  const color = OUTCOME_COLOR[roll.outcome];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/[0.02] py-2 pr-4 pl-2 anim-rise">
      <D20 value={roll.natural} color={color} size={40} />
      <div className="min-w-0 text-sm leading-tight">
        <div className="truncate text-muted">{roll.reason}</div>
        <div className="mt-0.5">
          <span style={{ color }} className="font-semibold">
            {OUTCOME_LABEL[roll.outcome]}
          </span>
          <span className="text-faint tabular-nums">
            {" "}
            · {roll.statLabel} {fmtMod(roll.modifier)} → {roll.total} vs {roll.dc}
            {roll.rerolled ? " · fate" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
