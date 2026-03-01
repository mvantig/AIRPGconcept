"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Persona, GamePhase, GameMode, UniverseConfig } from "@/types/game";
import LoginButton from "@/components/LoginButton";
import UniverseSetup from "@/components/UniverseSetup";
import PersonaSetup from "@/components/PersonaSetup";
import GameScreen from "@/components/GameScreen";

export default function Home() {
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<GamePhase>("universe");
  const [universe, setUniverse] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("fictional");
  const [persona, setPersona] = useState<Persona | null>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginButton />;
  }

  const handleUniverseSubmit = (config: UniverseConfig) => {
    setUniverse(config.setting);
    setGameMode(config.mode);
    setPhase("persona");
  };

  const handlePersonaConfirm = (p: Persona) => {
    setPersona(p);
    setPhase("playing");
  };

  if (phase === "universe") {
    return <UniverseSetup onSubmit={handleUniverseSubmit} user={session.user} />;
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
      <GameScreen persona={persona} universe={universe} gameMode={gameMode} />
    );
  }

  return null;
}
