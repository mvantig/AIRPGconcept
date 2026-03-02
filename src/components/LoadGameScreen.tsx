"use client";

import { useState, useEffect, useCallback } from "react";

interface SavedSession {
  id: string;
  universe: string;
  gameMode: string;
  personaName: string;
  location: string;
  hp: number;
  maxHp: number;
  imageUrl: string | null;
  saveType: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LoadGameScreenProps {
  onLoad: (sessionId: string) => void;
  onBack: () => void;
}

export default function LoadGameScreen({ onLoad, onBack }: LoadGameScreenProps) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this save?")) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Load Game</h2>
            <p className="text-[var(--color-text-dim)] text-sm mt-1">
              Select a save to continue your adventure
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-sm border transition-all hover:bg-purple-500/10 hover:border-purple-500/50 cursor-pointer"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-dim)",
            }}
          >
            Back to Menu
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div
            className="rounded-2xl p-12 border text-center"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <p className="text-[var(--color-text-dim)]">No saved games found.</p>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              Start a New Game
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-[1fr_140px_140px_80px_40px] gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b"
              style={{
                color: "var(--color-text-dim)",
                borderColor: "var(--color-border)",
              }}
            >
              <span>Character / Universe</span>
              <span>Location</span>
              <span>Save Time</span>
              <span className="text-center">Type</span>
              <span />
            </div>

            {/* Save entries */}
            <div className="max-h-[420px] overflow-y-auto">
              {sessions.map((s) => {
                const hpPercent = Math.max(0, (s.hp / s.maxHp) * 100);
                const hpColor =
                  hpPercent > 60 ? "#22c55e" : hpPercent > 30 ? "#f59e0b" : "#ef4444";
                const saveTime = formatDate(s.updatedAt);

                return (
                  <button
                    key={s.id}
                    onClick={() => onLoad(s.id)}
                    className="w-full grid grid-cols-[1fr_140px_140px_80px_40px] gap-2 px-4 py-3 text-left transition-all hover:bg-purple-500/5 cursor-pointer group border-b last:border-b-0"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {/* Character / Universe */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-purple-400 truncate">
                          {s.personaName}
                        </span>
                        {s.label && (
                          <span className="text-[10px] text-[var(--color-text-dim)] italic truncate">
                            {s.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-dim)] truncate">
                        {s.universe}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--color-bg)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${hpPercent}%`, background: hpColor }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums" style={{ color: hpColor }}>
                          {s.hp}/{s.maxHp}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center">
                      <span className="text-xs text-[var(--color-text-dim)] truncate">
                        {s.location}
                      </span>
                    </div>

                    {/* Save time */}
                    <div className="flex items-center">
                      <span className="text-xs text-[var(--color-text-dim)] tabular-nums">
                        {saveTime}
                      </span>
                    </div>

                    {/* Type badge */}
                    <div className="flex items-center justify-center">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            s.saveType === "manual"
                              ? "rgba(34, 197, 94, 0.15)"
                              : "rgba(136, 136, 160, 0.15)",
                          color:
                            s.saveType === "manual" ? "#22c55e" : "var(--color-text-dim)",
                        }}
                      >
                        {s.saveType === "manual" ? "Manual" : "Auto"}
                      </span>
                    </div>

                    {/* Delete */}
                    <div className="flex items-center justify-center">
                      <span
                        onClick={(e) => handleDelete(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 transition-all cursor-pointer"
                        title="Delete save"
                      >
                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
