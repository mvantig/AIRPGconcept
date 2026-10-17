"use client";

import { useRef, useState } from "react";
import type { SaveMeta } from "@/lib/client/saves";
import type { Status } from "@/lib/client/narrator";
import { Portrait } from "./Art";
import { IconDownload, IconQuill, IconTrash, IconUpload } from "./Icons";
import { LoomBackdrop } from "./LoomBackdrop";

interface Props {
  saves: SaveMeta[];
  status: Status | null;
  onNew: () => void;
  onContinue: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onImport: (file: File) => void;
}

export function TitleScreen({ saves, status, onNew, onContinue, onDelete, onExport, onImport }: Props) {
  const latest = saves.find((s) => !s.over) ?? saves[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <LoomBackdrop />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-10 sm:px-8">
        <header className="flex items-center justify-between">
          <span className="eyebrow">An illustrated tale-weaving RPG</span>
          <NarratorBadge status={status} />
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <h1 className="anim-rise font-[family-name:var(--font-display)] text-[clamp(3.2rem,11vw,7.5rem)] leading-[0.9] font-medium tracking-[-0.03em]">
            Realm<span className="text-[var(--accent)] italic">weaver</span>
          </h1>
          <p className="anim-rise mt-6 max-w-xl font-[family-name:var(--font-serif)] text-lg text-muted [animation-delay:120ms] sm:text-xl">
            Name any world, real or imagined. Choose who you are. Then write the story together with a narrator who remembers
            everything and rolls the dice fairly.
          </p>
          <div className="anim-rise mt-10 flex flex-col items-center gap-3 [animation-delay:240ms] sm:flex-row">
            <button className="btn btn-primary px-7 py-3.5 text-base anim-glow" onClick={onNew}>
              <IconQuill size={18} /> Begin a new tale
            </button>
            {latest && (
              <button className="btn btn-ghost px-6 py-3.5 text-base" onClick={() => onContinue(latest.id)}>
                Continue {latest.hero}&rsquo;s story
              </button>
            )}
          </div>
        </section>

        <section className="anim-rise [animation-delay:360ms]">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="eyebrow">Your tales</h2>
            <button className="flex items-center gap-1.5 text-sm text-muted transition hover:text-[var(--accent)]" onClick={() => fileRef.current?.click()}>
              <IconUpload size={15} /> Import a tale
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
          </div>
          {saves.length === 0 ? (
            <p className="panel px-5 py-6 text-center text-sm text-muted">
              No tales yet. Every story you start is saved on this device, automatically, after every turn.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {saves.map((s) => (
                <li key={s.id} className="panel group relative flex items-center gap-4 p-4 transition hover:border-[var(--accent)]">
                  <button className="absolute inset-0 rounded-[1.25rem]" aria-label={`Continue ${s.title}`} onClick={() => onContinue(s.id)} />
                  <div style={{ ["--accent" as string]: s.accent }}>
                    <Portrait imageId={s.portrait} name={s.hero} size={52} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-[family-name:var(--font-display)] text-lg">{s.title}</div>
                    <div className="truncate text-sm text-muted">
                      {s.hero}, {s.epithet} · Lv {s.level}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-faint">
                      {s.over ? "Fallen" : `Chapter ${s.chapter || 1}`} · {s.location} · {timeAgo(s.updatedAt)}
                    </div>
                  </div>
                  <div className="relative z-10 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button className="icon-btn !h-8 !w-8" title="Export tale" aria-label="Export tale" onClick={() => onExport(s.id)}>
                      <IconDownload size={15} />
                    </button>
                    {confirming === s.id ? (
                      <button className="rounded-full bg-[var(--color-bad)] px-3 text-xs font-semibold text-black" onClick={() => onDelete(s.id)} onBlur={() => setConfirming(null)} autoFocus>
                        Delete?
                      </button>
                    ) : (
                      <button className="icon-btn !h-8 !w-8" title="Delete tale" aria-label="Delete tale" onClick={() => setConfirming(s.id)}>
                        <IconTrash size={15} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

const NARRATOR_NAME = { claude: "Claude", gemini: "Gemini", demo: "the demo" } as const;

export function NarratorBadge({ status }: { status: Status | null }) {
  if (!status) return <span className="h-7 w-28 rounded-full shimmer" />;
  const demo = status.narrator === "demo";
  return (
    <span
      className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-black/30 px-3 py-1.5 text-xs text-muted backdrop-blur"
      title={demo ? "No API key set: a hand-written demo narrator is running." : `${NARRATOR_NAME[status.narrator]} is narrating.`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${demo ? "bg-[var(--color-quest)]" : "bg-[var(--color-good)]"}`} />
      {demo ? "Demo narrator" : `Narrated by ${NARRATOR_NAME[status.narrator]}`}
      {status.painter && <span className="text-faint">· Illustrated</span>}
    </span>
  );
}

function timeAgo(t: number): string {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
