"use client";

import { useState } from "react";
import type { Persona, GamePhase } from "@/types/game";
import UniverseSetup from "@/components/UniverseSetup";
import PersonaSetup from "@/components/PersonaSetup";
import GameScreen from "@/components/GameScreen";

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("universe");
  const [universe, setUniverse] = useState("");
  const [persona, setPersona] = useState<Persona | null>(null);

  const handleUniverseSubmit = (uni: string) => {
    setUniverse(uni);
    setPhase("persona");
  };

  const handlePersonaConfirm = (p: Persona) => {
    setPersona(p);
    setPhase("playing");
  };

  if (phase === "universe") {
    return <UniverseSetup onSubmit={handleUniverseSubmit} />;
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
