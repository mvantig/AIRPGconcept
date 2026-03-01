"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import type { GameMode, UniverseConfig } from "@/types/game";
import SavedGames from "./SavedGames";

interface UserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UniverseSetupProps {
  onSubmit: (config: UniverseConfig) => void;
  onLoadSession: (sessionId: string) => void;
  user?: UserInfo;
}

const FICTIONAL_SUGGESTIONS = [
  "Lord of the Rings",
  "Cyberpunk 2077",
  "Star Wars",
  "Lovecraftian Horror",
  "Feudal Japan",
  "Post-Apocalyptic Wasteland",
  "Pirate Age Caribbean",
  "Victorian Steampunk London",
];

const HISTORICAL_ERAS = [
  {
    name: "Ancient Egypt",
    period: "1350 BC, Thebes, Egypt",
    desc: "The reign of Pharaoh Akhenaten and the age of the great temples",
  },
  {
    name: "Classical Athens",
    period: "430 BC, Athens, Greece",
    desc: "The golden age of Pericles, philosophy, and democracy",
  },
  {
    name: "Roman Empire",
    period: "117 AD, Rome, Roman Empire",
    desc: "The height of imperial power under Emperor Trajan",
  },
  {
    name: "Viking Age",
    period: "870 AD, Scandinavia",
    desc: "Norse exploration, raids, and the founding of settlements",
  },
  {
    name: "Medieval Crusades",
    period: "1190 AD, Jerusalem",
    desc: "The Third Crusade and the clash between Richard and Saladin",
  },
  {
    name: "Renaissance Florence",
    period: "1492, Florence, Italy",
    desc: "The Medici era, Leonardo da Vinci, and the birth of modern art",
  },
  {
    name: "Age of Exploration",
    period: "1520, Atlantic Ocean",
    desc: "Magellan's circumnavigation and the Age of Discovery",
  },
  {
    name: "French Revolution",
    period: "1793, Paris, France",
    desc: "The Reign of Terror, liberty, and upheaval",
  },
  {
    name: "American Wild West",
    period: "1875, Tombstone, Arizona",
    desc: "Outlaws, frontiers, gold rushes, and the expanding railroad",
  },
  {
    name: "Industrial Revolution",
    period: "1845, London, England",
    desc: "Steam power, factories, and the transformation of society",
  },
  {
    name: "World War II",
    period: "1943, Europe",
    desc: "The turning point of the war and stories of resistance",
  },
  {
    name: "Cold War",
    period: "1962, Berlin, Germany",
    desc: "Espionage, the Berlin Wall, and the Cuban Missile Crisis",
  },
];

export default function UniverseSetup({ onSubmit, onLoadSession, user }: UniverseSetupProps) {
  const [mode, setMode] = useState<GameMode>("fictional");
  const [fictionalInput, setFictionalInput] = useState("");
  const [historicalInput, setHistoricalInput] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  const handleFictionalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fictionalInput.trim()) {
      onSubmit({ mode: "fictional", setting: fictionalInput.trim() });
    }
  };

  const handleHistoricalPreset = (era: (typeof HISTORICAL_ERAS)[number]) => {
    setHistoricalInput(era.period);
  };

  const handleHistoricalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const setting = historicalInput.trim();
    if (setting) {
      onSubmit({ mode: "historical", setting });
    }
  };

  const handleCustomHistorical = (e: React.FormEvent) => {
    e.preventDefault();
    if (customYear.trim() && customLocation.trim()) {
      const setting = `${customYear.trim()}, ${customLocation.trim()}`;
      setHistoricalInput(setting);
      onSubmit({ mode: "historical", setting });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-8 h-8 rounded-full border border-purple-500/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {user.name?.charAt(0) || "?"}
              </div>
            )}
            <span className="text-sm text-[var(--color-text-dim)]">
              {user.name}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-red-500/10 hover:border-red-500/50 cursor-pointer"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-dim)",
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Realm Weaver
          </h1>
          <p className="text-[var(--color-text-dim)] text-lg">
            A split-screen text adventure RPG powered by AI
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={() => setMode("fictional")}
            className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${
              mode === "fictional"
                ? "bg-purple-600 text-white"
                : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface-light)]"
            }`}
            style={mode !== "fictional" ? { background: "var(--color-surface)" } : undefined}
          >
            Fictional Universe
          </button>
          <button
            onClick={() => setMode("historical")}
            className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${
              mode === "historical"
                ? "bg-amber-600 text-white"
                : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface-light)]"
            }`}
            style={mode !== "historical" ? { background: "var(--color-surface)" } : undefined}
          >
            Historical Era
          </button>
        </div>

        {/* Fictional Universe Panel */}
        {mode === "fictional" && (
          <div
            className="rounded-2xl p-8 border animate-fade-in"
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

            <form onSubmit={handleFictionalSubmit}>
              <input
                type="text"
                value={fictionalInput}
                onChange={(e) => setFictionalInput(e.target.value)}
                placeholder="e.g. A dying solar system where magic flows through starlight..."
                className="w-full px-4 py-3 rounded-xl border text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                style={{
                  background: "var(--color-surface-light)",
                  borderColor: "var(--color-border)",
                }}
                autoFocus
              />

              <div className="flex flex-wrap gap-2 mt-4">
                {FICTIONAL_SUGGESTIONS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setFictionalInput(s)}
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
                disabled={!fictionalInput.trim()}
                className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: fictionalInput.trim()
                    ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                    : "var(--color-surface-light)",
                }}
              >
                Enter This Universe
              </button>
            </form>
          </div>
        )}

        {/* Historical Era Panel */}
        {mode === "historical" && (
          <div className="animate-fade-in space-y-4">
            <div
              className="rounded-2xl p-8 border"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <h2 className="text-2xl font-semibold mb-1">Travel Through Time</h2>
              <p className="text-[var(--color-text-dim)] mb-6">
                Pick a historical era or enter a specific year and place. Your adventure
                will be grounded in real historical events, people, and culture.
              </p>

              {/* Era Grid */}
              <div className="grid grid-cols-2 gap-2 mb-6 max-h-[280px] overflow-y-auto pr-1">
                {HISTORICAL_ERAS.map((era) => (
                  <button
                    key={era.name}
                    type="button"
                    onClick={() => handleHistoricalPreset(era)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      historicalInput === era.period
                        ? "border-amber-500/70 bg-amber-500/10"
                        : "hover:border-amber-500/30 hover:bg-amber-500/5"
                    }`}
                    style={{
                      background:
                        historicalInput === era.period
                          ? undefined
                          : "var(--color-bg)",
                      borderColor:
                        historicalInput === era.period
                          ? undefined
                          : "var(--color-border)",
                    }}
                  >
                    <div className="text-sm font-semibold text-amber-400">
                      {era.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                      {era.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected era submit */}
              {historicalInput && (
                <form onSubmit={handleHistoricalSubmit}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-4"
                    style={{
                      background: "var(--color-surface-light)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-[var(--color-text)]">{historicalInput}</span>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-semibold text-white transition-all cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #d97706, #b45309)",
                    }}
                  >
                    Enter This Era
                  </button>
                </form>
              )}
            </div>

            {/* Custom Year/Location */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <h3 className="text-lg font-semibold mb-1">Custom Time & Place</h3>
              <p className="text-[var(--color-text-dim)] text-sm mb-4">
                Enter any year and location to explore a specific moment in history.
              </p>
              <form onSubmit={handleCustomHistorical} className="flex gap-3">
                <input
                  type="text"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="e.g. 1776"
                  className="w-28 px-3 py-2.5 rounded-xl border text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                  style={{
                    background: "var(--color-surface-light)",
                    borderColor: "var(--color-border)",
                  }}
                />
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. Philadelphia, American Colonies"
                  className="flex-1 px-3 py-2.5 rounded-xl border text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                  style={{
                    background: "var(--color-surface-light)",
                    borderColor: "var(--color-border)",
                  }}
                />
                <button
                  type="submit"
                  disabled={!customYear.trim() || !customLocation.trim()}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  style={{
                    background:
                      customYear.trim() && customLocation.trim()
                        ? "linear-gradient(135deg, #d97706, #b45309)"
                        : "var(--color-surface-light)",
                  }}
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        )}

        <SavedGames onLoad={onLoadSession} />
      </div>
    </div>
  );
}
