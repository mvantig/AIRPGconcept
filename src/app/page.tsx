"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Persona, GamePhase, GameMode, UniverseConfig } from "@/types/game";
import LoginButton from "@/components/LoginButton";
import UniverseSetup from "@/components/UniverseSetup";
import PersonaSetup from "@/components/PersonaSetup";
import GameScreen, { type LoadedSession } from "@/components/GameScreen";

export default function Home() {
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<GamePhase>("universe");
  const [universe, setUniverse] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("fictional");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loadedSession, setLoadedSession] = useState<LoadedSession | undefined>();
  const [loadingSession, setLoadingSession] = useState(false);

  const handleUniverseSubmit = (config: UniverseConfig) => {
    setUniverse(config.setting);
    setGameMode(config.mode);
    setLoadedSession(undefined);
    setPhase("persona");
  };

  const handlePersonaConfirm = (p: Persona) => {
    setPersona(p);
    setLoadedSession(undefined);
    setPhase("playing");
  };

  const handleLoadSession = useCallback(async (sessionId: string) => {
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");

      const data = await res.json();

      setUniverse(data.universe);
      setGameMode(data.gameMode as GameMode);
      setPersona(data.persona);
      setLoadedSession({
        sessionId: data.id,
        gameState: data.gameState,
        chatHistory: data.chatHistory,
        storySummary: data.storySummary,
        imageUrl: data.imageUrl,
      });
      setPhase("playing");
    } catch {
      alert("Failed to load saved game. Please try again.");
    } finally {
      setLoadingSession(false);
    }
  }, []);

  if (status === "loading" || loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
          {loadingSession && (
            <p className="text-[var(--color-text-dim)] text-sm">Loading saved game...</p>
          )}
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginButton />;
  }

  if (phase === "universe") {
    return (
      <UniverseSetup
        onSubmit={handleUniverseSubmit}
        onLoadSession={handleLoadSession}
        user={session.user}
      />
    );
  }

  if (phase === "persona") {
    return (
      <PersonaSetup
        universe={universe}
        gameMode={gameMode}
        onConfirm={handlePersonaConfirm}
      />
    );
  }

  if (phase === "playing" && persona) {
    return (
      <GameScreen
        persona={persona}
        universe={universe}
        gameMode={gameMode}
        loadedSession={loadedSession}
      />
    );
  }

  return null;
}
