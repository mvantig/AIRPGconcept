import type { CSSProperties } from "react";
import type { Mood, Palette } from "@/lib/types";

// Each world re-tints the whole interface. Colors from the narrator are nudged
// until they read well on the dark background, so a bad palette can't hurt legibility.

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0xe0a84f;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Lighten until the color reaches at least the given luminance. */
function brighten(hex: string, min: number): string {
  let rgb = hexToRgb(hex);
  for (let i = 0; i < 12 && luminance(rgb) < min; i++) rgb = mix(rgb, [255, 255, 255], 0.15);
  return rgbToHex(rgb);
}

function darken(hex: string, max: number): string {
  let rgb = hexToRgb(hex);
  for (let i = 0; i < 20 && luminance(rgb) > max; i++) rgb = mix(rgb, [0, 0, 0], 0.2);
  return rgbToHex(rgb);
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function themeVars(palette: Palette): CSSProperties {
  const accent = brighten(palette.accent, 0.3);
  const accent2 = brighten(palette.accent2, 0.25);
  const ink = darken(palette.ink, 0.012);
  const inkRgb = hexToRgb(ink);
  return {
    "--accent": accent,
    "--accent-soft": rgba(accent, 0.16),
    "--accent-glow": rgba(accent, 0.45),
    "--accent2": accent2,
    "--accent2-soft": rgba(accent2, 0.16),
    "--ink": ink,
    "--ink-2": rgbToHex(mix(inkRgb, [255, 255, 255], 0.04)),
    "--ink-3": rgbToHex(mix(inkRgb, [255, 255, 255], 0.08)),
    "--line": rgba(rgbToHex(mix(inkRgb, [255, 255, 255], 0.6)), 0.14),
  } as CSSProperties;
}

export const MOOD_TINT: Record<Mood, string> = {
  calm: "rgba(120, 160, 200, 0.10)",
  tense: "rgba(200, 150, 60, 0.14)",
  combat: "rgba(220, 60, 50, 0.20)",
  wonder: "rgba(140, 200, 255, 0.16)",
  dread: "rgba(70, 40, 110, 0.26)",
  triumph: "rgba(255, 200, 80, 0.18)",
  sorrow: "rgba(60, 80, 120, 0.24)",
};

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seeded(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
