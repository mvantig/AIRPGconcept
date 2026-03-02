"use client";

import { useState } from "react";
import type { GameState, GameGoal, Persona } from "@/types/game";

interface StatusBarProps {
  persona: Persona;
  gameState: GameState;
  tokens: number | null;
  goal: GameGoal | null;
}

export default function StatusBar({ persona, gameState, tokens, goal }: StatusBarProps) {
  const [goalExpanded, setGoalExpanded] = useState(false);
  const hpPercent = Math.max(0, (gameState.hp / gameState.maxHp) * 100);
  const hpColor =
    hpPercent > 60 ? "#22c55e" : hpPercent > 30 ? "#f59e0b" : "#ef4444";
  const tokenColor =
    tokens === null ? "var(--color-text-dim)" : tokens > 10 ? "#a78bfa" : tokens > 0 ? "#f59e0b" : "#ef4444";
  const goalProgress = goal?.progress ?? 0;
  const goalColor =
    goalProgress >= 75 ? "#22c55e" : goalProgress >= 40 ? "#f59e0b" : "#a78bfa";

  return (
    <div className="shrink-0">
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-b text-sm"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-2">
          {persona.portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={persona.portraitUrl}
              alt={persona.name}
              className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
              {persona.name.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-purple-400">{persona.name}</span>
        </div>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        <div className="flex items-center gap-2 min-w-[140px]">
          <span className="text-[var(--color-text-dim)] text-xs">HP</span>
          <div
            className="flex-1 h-2 rounded-full overflow-hidden"
            style={{ background: "var(--color-bg)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${hpPercent}%`, background: hpColor }}
            />
          </div>
          <span className="text-xs tabular-nums" style={{ color: hpColor }}>
            {gameState.hp}/{gameState.maxHp}
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        <div className="flex items-center gap-1">
          <span className="text-[var(--color-gold)]">&#9733;</span>
          <span className="text-xs text-[var(--color-gold)] tabular-nums">
            {gameState.gold}
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        <div className="flex items-center gap-3">
          {Object.entries(gameState.stats).map(([stat, value]) => (
            <div key={stat} className="flex items-center gap-1">
              <span className="text-[var(--color-text-dim)] text-xs uppercase">
                {stat.slice(0, 3)}
              </span>
              <span className="text-xs font-semibold text-purple-300 tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        <div className="flex items-center gap-1 text-xs text-[var(--color-text-dim)]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{gameState.location || "Unknown"}</span>
        </div>

        {gameState.inventory.length > 0 && (
          <>
            <div className="h-4 w-px bg-[var(--color-border)]" />
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-dim)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>{gameState.inventory.length} items</span>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" style={{ color: tokenColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold tabular-nums" style={{ color: tokenColor }}>
            {tokens !== null ? tokens : "—"}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            tokens
          </span>
        </div>
      </div>

      {/* Goal Bar */}
      {goal && (
        <div
          className="px-4 py-1.5 border-b flex items-center gap-3 cursor-pointer select-none"
          style={{
            background: "var(--color-bg)",
            borderColor: "var(--color-border)",
          }}
          onClick={() => setGoalExpanded(!goalExpanded)}
        >
          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: goalColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold truncate" style={{ color: goalColor }}>
                {goal.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(124, 58, 237, 0.12)", color: "var(--color-text-dim)" }}>
                {goal.timeframe}
              </span>
            </div>
            {goalExpanded && (
              <p className="text-[11px] text-[var(--color-text-dim)] mt-0.5 leading-tight">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-20 h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--color-surface-light)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${goalProgress}%`, background: goalColor }}
              />
            </div>
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: goalColor }}>
              {goalProgress}%
            </span>
          </div>
          <svg
            className={`w-3 h-3 shrink-0 transition-transform ${goalExpanded ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-dim)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  );
}
