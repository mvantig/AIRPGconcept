"use client";

import { useState } from "react";

interface UniverseSetupProps {
  onSubmit: (universe: string) => void;
}

const SUGGESTIONS = [
  "Lord of the Rings",
  "Cyberpunk 2077",
  "Star Wars",
  "Lovecraftian Horror",
  "Feudal Japan",
  "Post-Apocalyptic Wasteland",
  "Pirate Age Caribbean",
  "Victorian Steampunk London",
];

export default function UniverseSetup({ onSubmit }: UniverseSetupProps) {
  const [universe, setUniverse] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (universe.trim()) onSubmit(universe.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Realm Weaver
          </h1>
          <p className="text-[var(--color-text-dim)] text-lg">
            A split-screen text adventure RPG powered by AI
          </p>
        </div>

        <div
          className="rounded-2xl p-8 border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2 className="text-2xl font-semibold mb-2">Choose Your Universe</h2>
          <p className="text-[var(--color-text-dim)] mb-6">
            Describe any world, setting, or franchise. Your adventure will be
            set within it.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
              placeholder="e.g. A dying solar system where magic flows through starlight..."
              className="w-full px-4 py-3 rounded-xl border text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              style={{
                background: "var(--color-surface-light)",
                borderColor: "var(--color-border)",
              }}
              autoFocus
            />

            <div className="flex flex-wrap gap-2 mt-4">
              {SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setUniverse(s)}
                  className="px-3 py-1.5 rounded-lg text-sm border transition-all hover:border-purple-500/50 hover:bg-purple-500/10 cursor-pointer"
                  style={{
                    background: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-dim)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!universe.trim()}
              className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: universe.trim()
                  ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                  : "var(--color-surface-light)",
              }}
            >
              Enter This Universe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
