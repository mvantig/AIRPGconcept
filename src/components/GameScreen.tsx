"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatMessage, GameState, Persona, ChatApiResponse, GameMode } from "@/types/game";
import ChatPanel from "./ChatPanel";
import IllustrationPanel from "./IllustrationPanel";
import StatusBar from "./StatusBar";
import InventoryDrawer from "./InventoryDrawer";

interface GameScreenProps {
  persona: Persona;
  universe: string;
  gameMode: GameMode;
}

function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const DEFAULT_GAME_STATE: GameState = {
  hp: 100,
  maxHp: 100,
  inventory: [],
  location: "Unknown",
  stats: {},
  gold: 0,
};

export default function GameScreen({ persona, universe, gameMode }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>({
    ...DEFAULT_GAME_STATE,
    stats: { ...persona.stats },
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [storySummary, setStorySummary] = useState("");
  const [currentImage, setCurrentImage] = useState<string | null>(
    persona.portraitUrl || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "scene">("chat");
  const [tokens, setTokens] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((d) => setTokens(d.tokens ?? null))
      .catch(() => {});
  }, []);

  const generateImage = useCallback(async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, gameMode }),
      });
      const data = await res.json();
      if (data.tokensRemaining !== undefined) {
        setTokens(data.tokensRemaining);
      }
      if (res.ok && data.imageUrl) {
        setCurrentImage(data.imageUrl);
      }
    } catch {
      // Image generation failure is non-critical
    } finally {
      setIsGeneratingImage(false);
    }
  }, [gameMode]);

  const sendMessage = useCallback(
    async (userInput: string) => {
      const userMsg: ChatMessage = {
        id: createId(),
        role: "user",
        content: userInput,
        timestamp: Date.now(),
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: "game_turn",
            messages: updatedMessages,
            gameState,
            persona,
            universe,
            gameMode,
            storySummary,
            userInput,
          }),
        });

        const data = await res.json();

        if (data.tokensRemaining !== undefined) {
          setTokens(data.tokensRemaining);
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to get response");
        }

        const assistantMsg: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: data.narrative,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (data.stateUpdates) {
          setGameState((prev) => ({
            ...prev,
            ...data.stateUpdates,
            stats: {
              ...prev.stats,
              ...(data.stateUpdates?.stats || {}),
            },
          }));
        }

        if (data.storySummary) {
          setStorySummary(data.storySummary);
        }

        if (data.imagePrompt) {
          generateImage(data.imagePrompt);
        }
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: createId(),
          role: "system",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong. Try again."}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, gameState, persona, universe, gameMode, storySummary, generateImage]
  );

  const startAdventure = useCallback(async () => {
    if (initialized) return;
    setInitialized(true);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "game_turn",
          messages: [],
          gameState: { ...DEFAULT_GAME_STATE, stats: { ...persona.stats } },
          persona,
          universe,
          gameMode,
          storySummary: "",
          userInput:
            gameMode === "historical"
              ? "Begin the adventure. Describe the opening historical scene vividly with accurate period details — architecture, people, sounds, smells. Set up an engaging initial situation rooted in real events of this era."
              : "Begin the adventure. Describe the opening scene vividly and set up the initial situation.",
        }),
      });

      const data: ChatApiResponse = await res.json();

      if (data.tokensRemaining !== undefined) {
        setTokens(data.tokensRemaining);
      }

      if (!res.ok) throw new Error("Failed to start adventure");

      const assistantMsg: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: data.narrative,
        timestamp: Date.now(),
      };
      setMessages([assistantMsg]);

      if (data.stateUpdates) {
        setGameState((prev) => ({
          ...prev,
          ...data.stateUpdates,
          stats: { ...prev.stats, ...(data.stateUpdates?.stats || {}) },
        }));
      }

      if (data.imagePrompt) {
        generateImage(data.imagePrompt);
      } else {
        const location = data.stateUpdates?.location || universe;
        generateImage(`A scenic establishing shot of ${location} in the universe of ${universe}`);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: createId(),
        role: "system",
        content: "Failed to start the adventure. Please refresh and try again.",
        timestamp: Date.now(),
      };
      setMessages([errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [initialized, persona, universe, gameMode, generateImage]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in max-w-md">
          <div className="mb-6">
            {persona.portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={persona.portraitUrl}
                alt={persona.name}
                className="w-32 h-32 rounded-2xl object-cover mx-auto border-2 border-purple-500/50 animate-pulse-glow"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-purple-600 mx-auto flex items-center justify-center text-white text-4xl font-bold animate-pulse-glow">
                {persona.name.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-purple-400 mb-2">
            {persona.name}
          </h2>
          <p className="text-[var(--color-text-dim)] mb-2 text-sm">
            {persona.backstory}
          </p>
          <p className="text-[var(--color-text-dim)] text-xs mb-6 opacity-60">
            Universe: {universe}
          </p>
          <button
            onClick={startAdventure}
            className="px-8 py-3 rounded-xl font-semibold text-white text-lg transition-all animate-pulse-glow cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            }}
          >
            Begin Adventure
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <StatusBar persona={persona} gameState={gameState} tokens={tokens} />

      {isMobile && (
        <div
          className="flex border-b"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              mobileTab === "chat"
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-[var(--color-text-dim)]"
            }`}
          >
            Adventure Log
          </button>
          <button
            onClick={() => setMobileTab("scene")}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              mobileTab === "scene"
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-[var(--color-text-dim)]"
            }`}
          >
            Scene
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${
            isMobile
              ? mobileTab === "chat"
                ? "w-full"
                : "hidden"
              : "w-1/2"
          } flex flex-col border-r`}
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          {!isMobile && (
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h3 className="text-sm font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
                Adventure Log
              </h3>
              <button
                onClick={() => setInventoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-all hover:bg-purple-500/10 hover:border-purple-500/50 cursor-pointer"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-dim)",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Inventory ({gameState.inventory.length})
              </button>
            </div>
          )}
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>

        <div
          className={`${
            isMobile
              ? mobileTab === "scene"
                ? "w-full"
                : "hidden"
              : "w-1/2"
          }`}
          style={{ background: "var(--color-bg)" }}
        >
          <IllustrationPanel
            imageUrl={currentImage}
            isGenerating={isGeneratingImage}
            location={gameState.location}
          />
        </div>
      </div>

      <InventoryDrawer
        gameState={gameState}
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
      />
    </div>
  );
}
