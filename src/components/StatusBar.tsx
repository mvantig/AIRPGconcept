"use client";

import type { GameState, Persona } from "@/types/game";

interface StatusBarProps {
  persona: Persona;
  gameState: GameState;
}

export default function StatusBar({ persona, gameState }: StatusBarProps) {
  const hpPercent = Math.max(0, (gameState.hp / gameState.maxHp) * 100);
  const hpColor =
    hpPercent > 60 ? "#22c55e" : hpPercent > 30 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 border-b text-sm"
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
    </div>
  );
}
