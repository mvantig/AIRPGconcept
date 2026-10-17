"use client";

import { useState } from "react";
import type { HeroDraft, StatKey, World } from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { STAT_BUDGET, normalizeStats, statTotal } from "@/lib/engine/rules";
import { fmtMod } from "@/lib/gm/prompts";
import { Portrait } from "./Art";
import { IconArrowLeft, IconQuill } from "./Icons";
import { ScenePainting } from "./ScenePainting";

interface Props {
  world: World;
  heroes: HeroDraft[];
  demo: boolean;
  onBack: () => void;
  onBegin: (hero: HeroDraft) => void;
}

const STAT_HINT: Record<StatKey, string> = {
  might: "force, endurance",
  grace: "agility, stealth",
  wits: "knowledge, perception",
  heart: "charm, will, empathy",
};

export function HeroScreen({ world, heroes, demo, onBack, onBegin }: Props) {
  const [drafts, setDrafts] = useState(heroes);
  const [selected, setSelected] = useState(0);
  const hero = drafts[selected];
  const update = (patch: Partial<HeroDraft>) => setDrafts((d) => d.map((h, i) => (i === selected ? { ...h, ...patch } : h)));
  const spent = statTotal(hero.stats);

  const bump = (k: StatKey, delta: number) => {
    const next = hero.stats[k] + delta;
    if (next < -1 || next > 4) return;
    if (delta > 0 && spent >= STAT_BUDGET) return;
    update({ stats: { ...hero.stats, [k]: next } });
  };

  return (
    <main className="relative min-h-dvh">
      <section className="relative h-[46vh] min-h-80 overflow-hidden">
        <ScenePainting palette={world.palette} seed={world.title} mood="wonder" className="absolute inset-0 h-full w-full anim-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[var(--ink)]" />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-8 sm:px-8">
          <button className="btn btn-ghost w-fit bg-black/30 px-4 py-2 text-sm backdrop-blur" onClick={onBack}>
            <IconArrowLeft size={16} /> Different world
          </button>
          <div className="mt-auto anim-rise">
            <span className="eyebrow text-parchment/80">{world.era ?? (demo ? "Demo world" : "A world woven for you")}</span>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight sm:text-7xl">{world.title}</h1>
            <p className="mt-3 max-w-2xl font-[family-name:var(--font-serif)] text-lg text-parchment/85 italic">{world.tagline}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <p className="font-[family-name:var(--font-serif)] text-lg leading-relaxed text-parchment/85 anim-rise">{world.premise}</p>
          <ul className="space-y-2 anim-rise [animation-delay:100ms]">
            {world.factions.map((f) => (
              <li key={f.name} className="text-sm leading-snug">
                <span className="font-semibold text-[var(--accent2)]">{f.name}.</span> <span className="text-muted">{f.summary}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 mb-5 anim-rise [animation-delay:160ms]">
          <span className="eyebrow">Step 2 of 2 · Your hero</span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Who are you in this story?</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Choose a hero">
          {drafts.map((h, i) => (
            <button
              key={i}
              role="radio"
              aria-checked={selected === i}
              onClick={() => setSelected(i)}
              className={`panel anim-rise p-5 text-left transition hover:-translate-y-0.5 ${selected === i ? "!border-[var(--accent)] shadow-[0_0_40px_-12px_var(--accent-glow)]" : ""}`}
              style={{ animationDelay: `${220 + i * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <Portrait name={h.name} size={52} ring={selected === i} />
                <div className="min-w-0">
                  <div className="truncate font-[family-name:var(--font-display)] text-xl">{h.name}</div>
                  <div className="truncate text-sm text-[var(--accent)]">{h.epithet}</div>
                </div>
              </div>
              <p className="mt-3 text-xs tracking-wider text-faint uppercase">{h.concept}</p>
              <p className="mt-2 line-clamp-4 font-[family-name:var(--font-serif)] text-[0.95rem] leading-relaxed text-parchment/85">{h.backstory}</p>
              <StatBars hero={h} world={world} />
              <div className="mt-4 flex gap-1.5 text-lg" aria-label="Starting kit">
                {h.kit.map((k) => (
                  <span key={k.name} title={`${k.name}: ${k.detail}`}>
                    {k.glyph}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <section key={selected} className="panel mt-6 grid gap-6 p-5 anim-rise sm:p-7 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block">
              <span className="eyebrow">Name</span>
              <input className="field mt-2 px-4 py-2.5 font-[family-name:var(--font-display)] text-lg" value={hero.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} />
            </label>
            <label className="block">
              <span className="eyebrow">Known as</span>
              <input className="field mt-2 px-4 py-2.5" value={hero.epithet} maxLength={40} onChange={(e) => update({ epithet: e.target.value })} />
            </label>
            <label className="block">
              <span className="eyebrow">Backstory</span>
              <textarea
                className="field mt-2 min-h-28 resize-y px-4 py-3 font-[family-name:var(--font-serif)] leading-relaxed"
                value={hero.backstory}
                maxLength={500}
                onChange={(e) => update({ backstory: e.target.value })}
              />
            </label>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Strengths</span>
              <span className={`text-sm ${spent < STAT_BUDGET ? "text-[var(--accent)]" : "text-faint"}`}>
                {STAT_BUDGET - spent} point{STAT_BUDGET - spent === 1 ? "" : "s"} to place
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {STAT_KEYS.map((k) => (
                <li key={k} className="flex items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{world.statLabels[k]}</div>
                    <div className="text-xs text-faint">{STAT_HINT[k]}</div>
                  </div>
                  <button className="icon-btn !h-8 !w-8 text-lg" onClick={() => bump(k, -1)} disabled={hero.stats[k] <= -1} aria-label={`Lower ${world.statLabels[k]}`}>
                    −
                  </button>
                  <span className="w-9 text-center font-[family-name:var(--font-display)] text-xl tabular-nums">{fmtMod(hero.stats[k])}</span>
                  <button
                    className="icon-btn !h-8 !w-8 text-lg"
                    onClick={() => bump(k, 1)}
                    disabled={hero.stats[k] >= 4 || spent >= STAT_BUDGET}
                    aria-label={`Raise ${world.statLabels[k]}`}
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              Every risky action rolls a d20 and adds one of these. Beat the difficulty to succeed; miss by a little and you succeed at a cost.
            </p>
            <button
              className="btn btn-primary mt-6 w-full px-7 py-3.5 text-base anim-glow"
              disabled={!hero.name.trim()}
              onClick={() => onBegin({ ...hero, name: hero.name.trim(), stats: normalizeStats(hero.stats) })}
            >
              <IconQuill size={18} /> {hero.name.trim() ? `Begin ${hero.name.trim()}’s tale` : "Begin the tale"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatBars({ hero, world }: { hero: HeroDraft; world: World }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
      {STAT_KEYS.map((k) => (
        <li key={k} className="text-xs">
          <div className="flex justify-between text-muted">
            <span>{world.statLabels[k]}</span>
            <span className="tabular-nums">{fmtMod(hero.stats[k])}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, ((hero.stats[k] + 1) / 5) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
