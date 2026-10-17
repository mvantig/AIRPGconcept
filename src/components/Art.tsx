"use client";

/* eslint-disable @next/next/no-img-element -- images are data URLs from IndexedDB */
import { useEffect, useState } from "react";
import type { Mood, Palette } from "@/lib/types";
import { getImage } from "@/lib/client/saves";
import { ScenePainting } from "./ScenePainting";

export function useStoredImage(id: string | null | undefined): string | null {
  const [state, setState] = useState<{ id: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!id) return;
    let live = true;
    getImage(id).then((url) => live && setState({ id, url: url ?? null }));
    return () => {
      live = false;
    };
  }, [id]);
  return id && state?.id === id ? state.url : null;
}

interface SceneViewProps {
  imageId: string | null;
  palette: Palette;
  seed: string;
  mood: Mood;
  painting?: boolean;
}

/** The big illustration: slow Ken Burns drift, crossfade on change, painted fallback. */
export function SceneView({ imageId, palette, seed, mood, painting }: SceneViewProps) {
  const url = useStoredImage(imageId);
  const [layers, setLayers] = useState<{ key: string; url: string | null }[]>([]);
  const key = url ? `img:${imageId}` : `svg:${seed}:${mood}`;

  useEffect(() => {
    setLayers((prev) => (prev.at(-1)?.key === key ? prev : [...prev.slice(-1), { key, url }]));
  }, [key, url]);

  return (
    <div className="absolute inset-0 isolate overflow-hidden bg-[var(--ink)]">
      {layers.map((layer, i) => (
        <div key={layer.key} className="absolute inset-0 anim-fade" style={{ animationDuration: "1.6s", zIndex: i }}>
          <div className="absolute inset-0 anim-kenburns">
            {layer.url ? (
              <img src={layer.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ScenePainting palette={palette} seed={seed} mood={mood} className="h-full w-full" />
            )}
          </div>
        </div>
      ))}
      {painting && (
        <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-full border border-[var(--line)] bg-black/50 px-3 py-1.5 text-xs text-muted backdrop-blur anim-fade">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
          Painting the scene…
        </div>
      )}
    </div>
  );
}

export function Portrait({
  imageId,
  name,
  size = 48,
  className = "",
  ring = true,
}: {
  imageId?: string | null;
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const url = useStoredImage(imageId);
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${ring ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--ink)]" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover anim-fade" />
      ) : (
        <div
          className="grid h-full w-full place-items-center font-[family-name:var(--font-display)] text-[var(--ink)]"
          style={{
            background: "radial-gradient(circle at 30% 25%, var(--accent), var(--accent2))",
            fontSize: size * 0.38,
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
