"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Persona, GamePhase } from "@/types/game";
import LoginButton from "@/components/LoginButton";
import UniverseSetup from "@/components/UniverseSetup";
import PersonaSetup from "@/components/PersonaSetup";
import GameScreen from "@/components/GameScreen";

export default function Home() {
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<GamePhase>("universe");
  const [universe, setUniverse] = useState("");
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

  const handleUniverseSubmit = (uni: string) => {
    setUniverse(uni);
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
      <PersonaSetup universe={universe} onConfirm={handlePersonaConfirm} />
    );
  }

  if (phase === "playing" && persona) {
    return <GameScreen persona={persona} universe={universe} />;
  }

  return null;
}
