"use client";

import { useState, useEffect } from "react";

interface IllustrationPanelProps {
  imageUrl: string | null;
  isGenerating: boolean;
  location: string;
}

export default function IllustrationPanel({
  imageUrl,
  isGenerating,
  location,
}: IllustrationPanelProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [imageUrl]);

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[var(--color-text-dim)] text-sm">
              Painting the scene...
            </p>
          </div>
        </div>
      )}

      {imageUrl ? (
        <div className="w-full h-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={location || "Scene illustration"}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
          />
          {location && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white/90 text-sm font-medium">{location}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">
          <div
            className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--color-surface-light)" }}
          >
            <svg
              className="w-10 h-10 text-[var(--color-text-dim)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
          <p className="text-[var(--color-text-dim)] text-sm">
            Scene illustrations will appear here
          </p>
          <p className="text-[var(--color-text-dim)] text-xs mt-1 opacity-60">
            Images generate on location changes and major events
          </p>
        </div>
      )}
    </div>
  );
}
