"use client";

import { useState } from "react";
import type { GameMode, Tone } from "@/lib/types";
import { TONES, presetsFor, type Preset } from "@/lib/presets";
import type { Status } from "@/lib/client/narrator";
import { IconArrowLeft, IconShuffle, IconSparkle } from "./Icons";
import { LoomBackdrop } from "./LoomBackdrop";
import { NarratorBadge } from "./TitleScreen";

interface Props {
  status: Status | null;
  error: string | null;
  onBack: () => void;
  onWeave: (mode: GameMode, seed: string, tone: Tone) => void;
}

export function LoomScreen({ status, error, onBack, onWeave }: Props) {
  const [mode, setMode] = useState<GameMode>("fiction");
  const [seed, setSeed] = useState("");
  const [tone, setTone] = useState<Tone>("mysterious");
  const presets = presetsFor(mode);

  const pick = (p: Preset) => {
    setSeed(p.seed);
    setTone(p.tone);
  };
  const surprise = () => pick(presets[Math.floor(Math.random() * presets.length)]);
  const ready = seed.trim().length >= 2;

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <LoomBackdrop intensity={0.6} />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-16 sm:px-8">
        <header className="flex items-center justify-between">
          <button className="btn btn-ghost px-4 py-2 text-sm" onClick={onBack}>
            <IconArrowLeft size={16} /> Back
          </button>
          <NarratorBadge status={status} />
        </header>

        <div className="mt-10 anim-rise">
          <span className="eyebrow">Step 1 of 2 · The world</span>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">Where does your story take place?</h1>
        </div>

        <div className="mt-8 inline-flex rounded-full border border-[var(--line)] bg-black/30 p-1 anim-rise [animation-delay:80ms]" role="tablist">
          {(["fiction", "history"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === m ? "bg-[var(--accent)] text-[#120f0a]" : "text-muted hover:text-parchment"}`}
              onClick={() => {
                setMode(m);
                setSeed("");
              }}
            >
              {m === "fiction" ? "Any world you imagine" : "A real moment in history"}
            </button>
          ))}
        </div>

        <form
          className="mt-6 anim-rise [animation-delay:140ms]"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onWeave(mode, seed.trim(), tone);
          }}
        >
          <div className="relative">
            <textarea
              className="field min-h-32 resize-none p-5 pr-14 font-[family-name:var(--font-serif)] text-lg leading-relaxed"
              placeholder={
                mode === "fiction"
                  ? "A floating city of alchemists at war with the clouds… or just “Star Wars, as a smuggler”."
                  : "A year and a place: “Edo, 1853, when the black ships arrive”."
              }
              value={seed}
              maxLength={600}
              onChange={(e) => setSeed(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ready) onWeave(mode, seed.trim(), tone);
              }}
              aria-label="Describe your world"
            />
            <button type="button" className="icon-btn absolute top-4 right-4" title="Surprise me" aria-label="Surprise me" onClick={surprise}>
              <IconShuffle size={16} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-2">Tone</span>
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.hint}
                onClick={() => setTone(t.id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  tone === t.id ? "border-[var(--accent)] bg-[var(--accent-soft)] text-parchment" : "border-[var(--line)] text-muted hover:text-parchment"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && <p className="mt-5 rounded-xl border border-[var(--color-bad)]/40 bg-[var(--color-bad)]/10 px-4 py-3 text-sm text-[var(--color-bad)]">{error}</p>}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-primary px-7 py-3.5 text-base" disabled={!ready}>
              <IconSparkle size={18} /> Weave this world
            </button>
            {status?.narrator === "demo" && (
              <span className="text-sm text-faint">Demo mode picks the closest of three hand-written worlds.</span>
            )}
          </div>
        </form>

        <section className="mt-14 anim-rise [animation-delay:220ms]">
          <h2 className="eyebrow mb-4">{mode === "fiction" ? "Or pull a thread" : "Or step into a moment"}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {presets.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => pick(p)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  seed === p.seed ? "border-[var(--accent)]" : "border-[var(--line)] hover:border-white/25"
                }`}
                style={{ background: `linear-gradient(150deg, ${p.colors[1]}cc, #0b0b0e 75%)` }}
              >
                <span
                  className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-90"
                  style={{ background: p.colors[0], opacity: 0.45 }}
                />
                <span className="relative block font-[family-name:var(--font-display)] text-lg leading-tight">{p.title}</span>
                <span className="relative mt-1 block text-xs text-muted">{p.blurb}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
