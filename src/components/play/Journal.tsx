"use client";

/* eslint-disable @next/next/no-img-element -- images are data URLs from IndexedDB */
import { useEffect, useMemo, useState } from "react";
import type { CodexKind, Game, StatKey } from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { FATE_MAX, STAT_MAX, xpForLevel } from "@/lib/engine/rules";
import { fmtMod } from "@/lib/gm/prompts";
import { Portrait, useStoredImage } from "../Art";
import { IconClose, IconCoin, IconFlame } from "../Icons";
import type { JournalTab } from "./Hud";
import { roman } from "./StoryLog";

const TABS: { id: JournalTab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "pack", label: "Pack" },
  { id: "quests", label: "Quests" },
  { id: "codex", label: "Codex" },
  { id: "chronicle", label: "Chronicle" },
  { id: "gallery", label: "Gallery" },
];

const KIND_LABEL: Record<CodexKind, string> = { character: "People", place: "Places", faction: "Factions", lore: "Lore" };

interface Props {
  game: Game;
  open: boolean;
  tab: JournalTab;
  onTab: (t: JournalTab) => void;
  onClose: () => void;
  onRaise: (s: StatKey) => void;
}

export function Journal({ game, open, tab, onTab, onClose, onRaise }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Journal"
        className={`absolute right-0 bottom-0 flex h-[88dvh] w-full flex-col rounded-t-3xl border border-[var(--line)] bg-[var(--ink-2)] shadow-2xl transition-transform duration-300 ease-out sm:top-0 sm:h-full sm:w-[440px] sm:rounded-none sm:rounded-l-3xl ${
          open ? "translate-x-0 translate-y-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Journal</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close journal">
            <IconClose size={16} />
          </button>
        </div>
        <nav className="scroll-quiet mt-3 flex gap-0.5 overflow-x-auto px-4 pb-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
              className={`shrink-0 rounded-full px-2.5 py-1.5 text-sm transition ${tab === t.id ? "bg-[var(--accent)] font-semibold text-[#120f0a]" : "text-muted hover:text-parchment"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-10">
          {tab === "hero" && <HeroTab game={game} onRaise={onRaise} />}
          {tab === "pack" && <PackTab game={game} />}
          {tab === "quests" && <QuestsTab game={game} />}
          {tab === "codex" && <CodexTab game={game} />}
          {tab === "chronicle" && <ChronicleTab game={game} />}
          {tab === "gallery" && <GalleryTab game={game} />}
        </div>
      </aside>
    </div>
  );
}

function HeroTab({ game, onRaise }: { game: Game; onRaise: (s: StatKey) => void }) {
  const { hero, state, world } = game;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Portrait imageId={hero.portrait} name={hero.name} size={88} />
        <div>
          <div className="font-[family-name:var(--font-display)] text-2xl leading-tight">{hero.name}</div>
          <div className="text-sm text-[var(--accent)]">{hero.epithet}</div>
          <div className="mt-1 text-xs text-faint">
            Level {state.level} · {state.xp}/{xpForLevel(state.level)} XP
          </div>
        </div>
      </div>
      <p className="font-[family-name:var(--font-serif)] leading-relaxed text-parchment/85">{hero.backstory}</p>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="Health" value={`${state.hp}/${state.maxHp}`} />
        <Stat
          label="Fate"
          value={
            <span className="flex justify-center gap-0.5">
              {Array.from({ length: FATE_MAX }, (_, i) => (
                <IconFlame key={i} size={15} className={i < state.fate ? "text-[var(--accent)]" : "text-white/15"} />
              ))}
            </span>
          }
        />
        <Stat
          label={world.currency}
          value={
            <span className="flex items-center justify-center gap-1">
              <IconCoin size={14} className="text-[var(--color-quest)]" /> {state.gold}
            </span>
          }
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="eyebrow">Strengths</h3>
          {state.unspentPoints > 0 && <span className="text-xs text-[var(--color-quest)]">{state.unspentPoints} point to place</span>}
        </div>
        <ul className="mt-2 space-y-1.5">
          {STAT_KEYS.map((k) => (
            <li key={k} className="flex items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2">
              <span className="flex-1">{world.statLabels[k]}</span>
              <span className="font-[family-name:var(--font-display)] text-lg tabular-nums">{fmtMod(hero.stats[k])}</span>
              {state.unspentPoints > 0 && (
                <button className="icon-btn !h-7 !w-7" disabled={hero.stats[k] >= STAT_MAX} onClick={() => onRaise(k)} aria-label={`Raise ${world.statLabels[k]}`}>
                  +
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {state.conditions.length > 0 && (
        <div>
          <h3 className="eyebrow">Conditions</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {state.conditions.map((c) => (
              <li key={c} className="rounded-full border border-[var(--color-bad)]/40 px-3 py-1 text-xs text-[var(--color-bad)]">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--line)] px-2 py-2.5">
      <div className="text-[10px] tracking-widest text-faint uppercase">{label}</div>
      <div className="mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function PackTab({ game }: { game: Game }) {
  const items = game.state.inventory;
  if (!items.length) return <Empty text="Your pack is empty." />;
  return (
    <ul className="grid grid-cols-1 gap-2">
      {items.map((it) => (
        <li key={it.name} className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-2xl">{it.glyph}</span>
          <div className="min-w-0">
            <div className="font-semibold">{it.name}</div>
            <div className="text-sm text-muted">{it.detail}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function QuestsTab({ game }: { game: Game }) {
  const active = game.quests.filter((q) => q.status === "active").sort((a, b) => Number(b.main) - Number(a.main));
  const done = game.quests.filter((q) => q.status !== "active");
  if (!game.quests.length) return <Empty text="No quests yet. They'll find you." />;
  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {active.map((q) => (
          <li key={q.id} className={`rounded-2xl border p-4 ${q.main ? "border-[var(--accent2)]/50 bg-[var(--accent2-soft)]" : "border-[var(--line)]"}`}>
            <div className="flex items-center gap-2">
              {q.main && <span className="eyebrow !text-[var(--accent2)]">Main</span>}
              <span className="font-semibold">{q.title}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{q.objective}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-[var(--accent2)]" style={{ width: `${q.progress}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <div>
          <h3 className="eyebrow">Concluded</h3>
          <ul className="mt-2 space-y-1.5">
            {done.map((q) => (
              <li key={q.id} className="flex items-center gap-2 text-sm">
                <span className={q.status === "completed" ? "text-[var(--color-good)]" : "text-[var(--color-bad)]"}>{q.status === "completed" ? "✓" : "✗"}</span>
                <span className={q.status === "failed" ? "text-faint line-through" : "text-muted"}>{q.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CodexTab({ game }: { game: Game }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = game.codex.filter((c) => !q || c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q));
    return (["character", "place", "faction", "lore"] as CodexKind[])
      .map((kind) => ({ kind, entries: hits.filter((c) => c.kind === kind) }))
      .filter((g) => g.entries.length);
  }, [game.codex, query]);
  return (
    <div className="space-y-5">
      <input className="field rounded-full px-4 py-2 text-sm" placeholder="Search names and lore…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the codex" />
      {groups.length === 0 && <Empty text={query ? "Nothing by that name." : "The codex fills as you meet people and places."} />}
      {groups.map((g) => (
        <div key={g.kind}>
          <h3 className="eyebrow">{KIND_LABEL[g.kind]}</h3>
          <dl className="mt-2 space-y-2">
            {g.entries.map((e) => (
              <div key={e.name} className="rounded-xl border border-[var(--line)] px-3 py-2.5">
                <dt className="font-semibold text-[var(--accent)]">{e.name}</dt>
                <dd className="mt-0.5 text-sm text-muted">{e.summary}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function ChronicleTab({ game }: { game: Game }) {
  const chapters = useMemo(() => {
    const titles = new Map<number, string>();
    for (const e of game.log) if (e.kind === "chapter") titles.set(e.chapter, e.title);
    const byChapter = new Map<number, string[]>();
    for (const c of game.chronicle) byChapter.set(c.chapter, [...(byChapter.get(c.chapter) ?? []), c.text]);
    return [...byChapter.entries()].map(([n, lines]) => ({ n, title: titles.get(n) ?? "", lines }));
  }, [game.chronicle, game.log]);
  if (!chapters.length) return <Empty text="Your deeds will be recorded here." />;
  return (
    <ol className="space-y-6">
      {chapters.map((ch) => (
        <li key={ch.n}>
          <div className="eyebrow !text-[var(--accent)]">Chapter {roman(ch.n)}</div>
          <div className="font-[family-name:var(--font-display)] text-xl italic">{ch.title}</div>
          <ul className="mt-2 space-y-2 border-l border-[var(--line)] pl-4">
            {ch.lines.map((l, i) => (
              <li key={i} className="font-[family-name:var(--font-serif)] text-[0.95rem] leading-relaxed text-parchment/85">
                {l}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function GalleryTab({ game }: { game: Game }) {
  if (!game.gallery.length)
    return <Empty text="Illustrations you collect along the way appear here. Add a GEMINI_API_KEY to have every new scene painted." />;
  return (
    <ul className="grid grid-cols-2 gap-2">
      {[...game.gallery].reverse().map((g) => (
        <GalleryImage key={g.imageId} id={g.imageId} caption={g.caption} />
      ))}
    </ul>
  );
}

function GalleryImage({ id, caption }: { id: string; caption: string }) {
  const url = useStoredImage(id);
  return (
    <li className="overflow-hidden rounded-xl border border-[var(--line)]">
      {url ? <img src={url} alt={caption} className="aspect-video w-full object-cover" /> : <div className="aspect-video shimmer" />}
      <div className="truncate px-2 py-1.5 text-xs text-muted">{caption}</div>
    </li>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-faint">{text}</p>;
}
