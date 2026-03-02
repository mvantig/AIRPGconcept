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
  updatedAt: string;
}

interface SavedGamesProps {
  onLoad: (sessionId: string) => void;
}

export default function SavedGames({ onLoad }: SavedGamesProps) {
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
    if (!confirm("Delete this saved game?")) return;

    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // Silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-6 border mt-4 animate-fade-in"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <h3 className="text-lg font-semibold mb-3">Continue Adventure</h3>
      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {sessions.map((s) => {
          const hpPercent = Math.max(0, (s.hp / s.maxHp) * 100);
          const timeAgo = getTimeAgo(s.updatedAt);
          return (
            <button
              key={s.id}
              onClick={() => onLoad(s.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer group"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-purple-400 truncate">
                    {s.personaName}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full uppercase"
                    style={{
                      background:
                        s.gameMode === "historical"
                          ? "rgba(217, 119, 6, 0.15)"
                          : "rgba(124, 58, 237, 0.15)",
                      color:
                        s.gameMode === "historical" ? "#d97706" : "#a78bfa",
                    }}
                  >
                    {s.gameMode}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-dim)] truncate mt-0.5">
                  {s.universe}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-12 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--color-surface-light)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${hpPercent}%`,
                          background:
                            hpPercent > 60
                              ? "#22c55e"
                              : hpPercent > 30
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--color-text-dim)]">
                      {s.hp}/{s.maxHp}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-dim)]">
                    {s.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[var(--color-text-dim)]">
                  {timeAgo}
                </span>
                <button
                  onClick={(e) => handleDelete(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 transition-all cursor-pointer"
                  title="Delete save"
                >
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
