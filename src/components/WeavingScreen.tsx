"use client";

import { useEffect, useState } from "react";
import { LoomBackdrop } from "./LoomBackdrop";

const LINES = [
  "Spinning the first threads…",
  "Raising mountains and drawing rivers…",
  "Naming the powers that be…",
  "Choosing a palette for the sky…",
  "Finding three people with a stake in this…",
  "Tying the last knots…",
];

export function WeavingScreen({ seed }: { seed: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, LINES.length - 1)), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6" aria-busy="true">
      <LoomBackdrop intensity={1.6} />
      <div className="relative z-10 max-w-xl text-center">
        <div className="mx-auto mb-10 h-20 w-20">
          <svg viewBox="0 0 80 80" className="h-full w-full animate-[spin_9s_linear_infinite]">
            {Array.from({ length: 6 }, (_, k) => (
              <ellipse key={k} cx="40" cy="40" rx="34" ry="12" fill="none" stroke={k % 2 ? "var(--accent2)" : "var(--accent)"} strokeWidth="1.2" opacity="0.7" transform={`rotate(${k * 30} 40 40)`} />
            ))}
            <circle cx="40" cy="40" r="5" fill="var(--accent)" className="animate-pulse" />
          </svg>
        </div>
        <p className="eyebrow">Weaving</p>
        <p className="mt-4 font-[family-name:var(--font-serif)] text-xl text-parchment/90 italic">&ldquo;{seed}&rdquo;</p>
        <p key={i} className="mt-8 text-muted anim-rise" aria-live="polite">
          {LINES[i]}
        </p>
      </div>
    </main>
  );
}
