"use client";

import { signOut } from "next-auth/react";

interface UserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface MainMenuProps {
  user?: UserInfo;
  hasLatestSave: boolean;
  hasSaves: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onLoadGame: () => void;
}

export default function MainMenu({
  user,
  hasLatestSave,
  hasSaves,
  onNewGame,
  onContinue,
  onLoadGame,
}: MainMenuProps) {
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

      <div className="w-full max-w-md animate-fade-in text-center">
        <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Realm Weaver
        </h1>
        <p className="text-[var(--color-text-dim)] text-lg mb-12">
          A split-screen text adventure RPG powered by AI
        </p>

        <div className="space-y-3">
          <button
            onClick={onNewGame}
            className="w-full py-4 rounded-xl font-semibold text-white text-lg transition-all cursor-pointer hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            }}
          >
            New Game
          </button>

          {hasLatestSave && (
            <button
              onClick={onContinue}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer border hover:bg-purple-500/10 hover:border-purple-500/50"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
                background: "var(--color-surface)",
              }}
            >
              Continue Last Game
            </button>
          )}

          {hasSaves && (
            <button
              onClick={onLoadGame}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer border hover:bg-purple-500/10 hover:border-purple-500/50"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-dim)",
                background: "var(--color-surface)",
              }}
            >
              Load Game
            </button>
          )}

          <button
            onClick={() => signOut()}
            className="w-full py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer border hover:bg-red-500/10 hover:border-red-500/50"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-dim)",
              background: "var(--color-surface)",
            }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
