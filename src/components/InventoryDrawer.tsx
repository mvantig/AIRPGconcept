"use client";

import type { GameState } from "@/types/game";

interface InventoryDrawerProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryDrawer({
  gameState,
  isOpen,
  onClose,
}: InventoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-80 h-full animate-fade-in overflow-y-auto border-l"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Inventory</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-light)] transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {gameState.inventory.length === 0 ? (
            <p className="text-[var(--color-text-dim)] text-sm text-center py-8">
              Your pack is empty.
            </p>
          ) : (
            <ul className="space-y-2">
              {gameState.inventory.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2"
                  style={{
                    background: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span className="text-purple-400">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
