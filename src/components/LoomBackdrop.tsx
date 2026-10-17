"use client";

// Glowing threads drifting across the screen: the "loom" behind every menu.

const THREADS = Array.from({ length: 14 }, (_, i) => {
  const y = 80 + i * 55;
  const a = (i * 37) % 120;
  return {
    d: `M-100,${y} C300,${y - 160 + a} 700,${y + 200 - a} 1100,${y - 40} S1500,${y + 120} 1800,${y - 60}`,
    color: i % 3 === 0 ? "var(--accent2)" : "var(--accent)",
    delay: `${(i * 0.37) % 3}s`,
    duration: `${5 + (i % 5)}s`,
    opacity: 0.08 + (i % 4) * 0.05,
  };
});

export function LoomBackdrop({ intensity = 1 }: { intensity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 38%, var(--accent-soft), transparent 70%), radial-gradient(40% 40% at 85% 90%, var(--accent2-soft), transparent 70%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        {THREADS.map((t, i) => (
          <path
            key={i}
            d={t.d}
            fill="none"
            stroke={t.color}
            strokeWidth={1.2}
            opacity={t.opacity * intensity}
            className="thread-path"
            style={{ animationDelay: t.delay, animationDuration: t.duration }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_40%,var(--ink)_100%)]" />
    </div>
  );
}
