"use client";

import { useState, useEffect, useCallback } from "react";
import type { Persona, PersonaProposal, GameMode } from "@/types/game";

interface PersonaSetupProps {
  universe: string;
  gameMode: GameMode;
  onConfirm: (persona: Persona) => void;
}

export default function PersonaSetup({ universe, gameMode, onConfirm }: PersonaSetupProps) {
  const [persona, setPersona] = useState<PersonaProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [modifyInput, setModifyInput] = useState("");
  const [modifying, setModifying] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setTimeout(() => setRetryCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryCountdown]);

  const generatePersona = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryCountdown(0);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "persona_generate",
          universe,
          gameMode,
          messages: [],
          gameState: {},
          persona: {},
          storySummary: "",
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 429) {
          setRetryCountdown(60);
        }
        throw new Error(errData.error || "Failed to generate persona");
      }
      const data = await res.json();
      if (data.persona) {
        setPersona(data.persona);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate persona");
    } finally {
      setLoading(false);
    }
  }, [universe, gameMode]);

  useEffect(() => {
    generatePersona();
  }, [generatePersona]);

  const handleModify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyInput.trim() || !persona) return;

    setModifying(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "persona_modify",
          universe,
          gameMode,
          messages: [],
          gameState: {},
          persona,
          storySummary: "",
          userInput: modifyInput.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to modify persona");
      }
      const data = await res.json();
      if (data.persona) {
        setPersona(data.persona);
        setModifyInput("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to modify persona");
    } finally {
      setModifying(false);
    }
  };

  const handleConfirm = async () => {
    if (!persona) return;
    setGeneratingPortrait(true);
    setError(null);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: gameMode === "historical"
            ? `Portrait of ${persona.name}, a historical figure from ${universe}. ${persona.backstory}. Close-up character portrait in period-accurate clothing, facing the viewer`
            : `Portrait of ${persona.name}, an RPG character from the universe "${universe}". ${persona.backstory}. Close-up character portrait, facing the viewer`,
          gameMode,
        }),
      });

      let portraitUrl: string | undefined;
      if (res.ok) {
        const data = await res.json();
        portraitUrl = data.imageUrl || undefined;
      }

      onConfirm({ ...persona, portraitUrl });
    } catch {
      onConfirm({ ...persona });
    } finally {
      setGeneratingPortrait(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-dim)] text-lg">
            Weaving your character from the threads of &quot;{universe}&quot;...
          </p>
        </div>
      </div>
    );
  }

  if (!persona) {
    const isRateLimit = error?.includes("rate limit") || error?.includes("quota");
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in max-w-md">
          <div
            className="rounded-2xl p-6 border mb-4"
            style={{
              background: "var(--color-surface)",
              borderColor: isRateLimit ? "#f59e0b44" : "var(--color-border)",
            }}
          >
            <p className={`mb-3 text-sm ${isRateLimit ? "text-[var(--color-gold)]" : "text-[var(--color-danger)]"}`}>
              {isRateLimit ? "API Rate Limit Reached" : "Something Went Wrong"}
            </p>
            <p className="text-[var(--color-text-dim)] text-sm mb-4">
              {error || "Failed to generate character"}
            </p>
            {retryCountdown > 0 && (
              <p className="text-[var(--color-text-dim)] text-xs mb-4">
                You can retry in <span className="text-purple-400 font-semibold">{retryCountdown}s</span>
              </p>
            )}
          </div>
          <button
            onClick={generatePersona}
            disabled={retryCountdown > 0}
            className="px-6 py-2 rounded-xl bg-purple-600 text-white font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {retryCountdown > 0 ? `Wait ${retryCountdown}s...` : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-6">
          <p className="text-[var(--color-text-dim)] text-sm uppercase tracking-wider">
            Universe: {universe}
          </p>
          <h2 className="text-3xl font-bold mt-1">Your Character</h2>
        </div>

        <div
          className="rounded-2xl p-6 border mb-4"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3 className="text-2xl font-bold text-purple-400 mb-3">
            {persona.name}
          </h3>

          <p className="text-[var(--color-text)] leading-relaxed mb-4">
            {persona.backstory}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(persona.stats).map(([stat, value]) => (
              <div
                key={stat}
                className="rounded-xl p-3 text-center border"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="text-2xl font-bold text-purple-400">
                  {value}
                </div>
                <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider mt-1">
                  {stat}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[var(--color-danger)] text-sm mb-3 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleModify} className="flex gap-2 mb-4">
          <input
            type="text"
            value={modifyInput}
            onChange={(e) => setModifyInput(e.target.value)}
            placeholder="Request changes... e.g. 'Make them a rogue with higher agility'"
            className="flex-1 px-4 py-2.5 rounded-xl border text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            style={{
              background: "var(--color-surface-light)",
              borderColor: "var(--color-border)",
            }}
            disabled={modifying}
          />
          <button
            type="submit"
            disabled={!modifyInput.trim() || modifying}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-purple-700 hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {modifying ? "Updating..." : "Modify"}
          </button>
        </form>

        <div className="flex gap-3">
          <button
            onClick={generatePersona}
            className="flex-1 py-3 rounded-xl font-semibold border transition-all hover:bg-purple-500/10 cursor-pointer"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-dim)",
            }}
          >
            Reroll Character
          </button>
          <button
            onClick={handleConfirm}
            disabled={generatingPortrait}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-all cursor-pointer disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            }}
          >
            {generatingPortrait ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Portrait...
              </span>
            ) : (
              "Confirm & Begin Adventure"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
