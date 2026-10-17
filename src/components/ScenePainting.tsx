"use client";

import { memo, useMemo } from "react";
import type { Mood, Palette } from "@/lib/types";
import { hashString, seeded } from "@/lib/client/theme";

// A generative "painted" vista, unique per location, used whenever no illustration exists yet
// (Demo mode, no image key, or while the next painting is on its way).

const W = 1600;
const H = 900;

function hex(c: string): [number, number, number] {
  const n = parseInt(c.replace("#", ""), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(a: string, b: string, t: number): string {
  const x = hex(a);
  const y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
}

function ridge(rand: () => number, baseY: number, amp: number, roughness: number): string {
  const n = 64;
  const pts: number[] = new Array(n + 1).fill(0);
  pts[0] = (rand() - 0.5) * amp;
  pts[n] = (rand() - 0.5) * amp;
  let step = n;
  let scale = amp;
  while (step > 1) {
    const half = step / 2;
    for (let i = half; i < n; i += step) {
      pts[i] = (pts[i - half] + pts[i + half]) / 2 + (rand() - 0.5) * scale;
    }
    scale *= roughness;
    step = half;
  }
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${((i / n) * W).toFixed(1)},${(baseY + p).toFixed(1)}`).join(" ");
  return `${d} L${W},${H} L0,${H} Z`;
}

interface Props {
  palette: Palette;
  seed: string;
  mood: Mood;
  className?: string;
}

function ScenePaintingImpl({ palette, seed, mood, className }: Props) {
  const art = useMemo(() => {
    const rand = seeded(hashString(seed));
    const night = mood !== "triumph" && rand() > 0.3;
    const skyTop = mixHex(palette.ink, palette.accent2, night ? 0.22 : 0.45);
    const skyMid = mixHex(palette.ink, palette.accent2, night ? 0.38 : 0.6);
    const horizon = mixHex(palette.ink, palette.accent, mood === "combat" ? 0.75 : 0.55);
    const orb = { x: 520 + rand() * 560, y: 140 + rand() * 180, r: 46 + rand() * 40 };
    const stars = night
      ? Array.from({ length: 90 }, () => ({ x: rand() * W, y: rand() * H * 0.5, r: rand() * 1.6 + 0.3, o: rand() * 0.7 + 0.2 }))
      : [];
    const layers = [0, 1, 2, 3].map((i) => ({
      d: ridge(rand, 430 + i * 110, 260 - i * 40, 0.55 + rand() * 0.1),
      color: mixHex(palette.accent2, palette.ink, 0.55 + i * 0.13),
    }));
    const city = rand() > 0.45;
    const towers = city
      ? Array.from({ length: 22 }, () => {
          const w = 18 + rand() * 46;
          const h = 60 + rand() * 230;
          const x = rand() * W;
          const windows = Array.from({ length: Math.floor(h / 26) }, (_, k) => ({ y: k * 26 + 14, lit: rand() > 0.55 }));
          return { x, w, h, spire: rand() > 0.7, windows };
        })
      : [];
    return { night, skyTop, skyMid, horizon, orb, stars, layers, towers };
  }, [palette.accent, palette.accent2, palette.ink, seed, mood]);

  const id = `p${hashString(seed + mood).toString(36)}`;
  const cityBase = 690;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="A painted vista">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={art.skyTop} />
          <stop offset="0.55" stopColor={art.skyMid} />
          <stop offset="0.82" stopColor={art.horizon} />
        </linearGradient>
        <radialGradient id={`${id}-orb`}>
          <stop offset="0" stopColor={palette.accent} stopOpacity="0.95" />
          <stop offset="0.25" stopColor={palette.accent} stopOpacity="0.5" />
          <stop offset="1" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fog`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      {art.stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
      ))}
      <circle cx={art.orb.x} cy={art.orb.y} r={art.orb.r * 5} fill={`url(#${id}-orb)`} />
      <circle cx={art.orb.x} cy={art.orb.y} r={art.orb.r} fill={palette.accent} opacity={art.night ? 0.85 : 1} />
      {art.layers.map((l, i) => (
        <g key={i}>
          <path d={l.d} fill={l.color} />
          {i === 1 &&
            art.towers.map((t, k) => (
              <g key={k} fill={l.color}>
                <rect x={t.x} y={cityBase - t.h} width={t.w} height={t.h + 200} />
                {t.spire && <path d={`M${t.x},${cityBase - t.h} L${t.x + t.w / 2},${cityBase - t.h - 60} L${t.x + t.w},${cityBase - t.h} Z`} />}
                {t.windows.map((w, j) =>
                  w.lit ? (
                    <rect key={j} x={t.x + t.w / 2 - 3} y={cityBase - t.h + w.y} width="6" height="9" fill={palette.accent} opacity="0.75" />
                  ) : null,
                )}
              </g>
            ))}
          <rect y={380 + i * 110} width={W} height="180" fill={`url(#${id}-fog)`} className="anim-drift" />
        </g>
      ))}
      <rect width={W} height={H} fill={`url(#${id}-vig)`} />
    </svg>
  );
}

export const ScenePainting = memo(ScenePaintingImpl);
