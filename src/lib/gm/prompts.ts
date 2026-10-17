import type { Game, GameMode, Roll, Tone, World } from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { OUTCOME_LABEL } from "@/lib/engine/dice";

const TONE_GUIDE: Record<Tone, string> = {
  heroic: "Heroic and adventurous: bold deeds, warm companionship, real stakes but room for triumph.",
  grim: "Grim and grounded: scarcity, hard choices, consequences that linger. Never gratuitous.",
  whimsical: "Whimsical and warm: wonder, wit and odd charm, with a sincere heart under the jokes.",
  mysterious: "Mysterious and atmospheric: secrets layered on secrets, slow-burning dread, clues that pay off.",
};

export function worldPrompt(mode: GameMode, seed: string, tone: Tone): string {
  const history =
    mode === "history"
      ? `This is HISTORY mode. Ground everything in the real period and place: real customs, prices, technology, politics and people. No anachronisms. Set "era" to a short "year, place" string. The art style should be a medium that fits the era (a fresco, a woodcut, a daguerreotype, period photojournalism...).`
      : `This is FICTION mode. If the seed names an existing franchise, capture its feel with your own original characters and places. Set "era" to null.`;
  return `Design a world for a single-player narrative RPG.

Seed from the player: """${seed}"""
Tone: ${TONE_GUIDE[tone]}
${history}

Return:
- title: an evocative 2-4 word name for this campaign; tagline: one line that makes someone want to play.
- premise: 2-3 sentences, present tense, concrete.
- artStyle: one sentence of art direction for every illustration (medium, palette, lighting, influences), so all scenes look like one illustrated book.
- palette: three hex colors drawn from that art direction. accent is a bright, saturated highlight that reads on a near-black background; accent2 is a contrasting secondary; ink is a very dark background tint (lightness under 12%).
- statLabels: in-world names for four core stats. might = force and endurance, grace = agility and stealth, wits = knowledge and perception, heart = charm, will and empathy. One word each, e.g. "Chrome", "Ghost", "Signal", "Soul".
- currency: what money is called here, lowercase.
- factions: three factions with conflicting goals, one sentence each.
- opening: two sentences describing the precise situation the story opens in. Start in motion, not with a recap.
- heroes: three distinct protagonists the player can choose between, each a different stat focus and a different way into the opening. For each: name, epithet ("the Quiet Blade"), concept (a few words), backstory (2 sentences with a personal stake in the opening), look (one sentence for a portrait painter), stats (integers from -1 to 3 whose total is exactly 5), kit (3 period-appropriate starting items, each with a one-line detail and a single emoji glyph).`;
}

/** Stable across the whole campaign so it caches well. */
export const GM_RULES = `You are the Weaver, the narrator and game master of Realmweaver, a single-player narrative RPG. You write the story; a rules engine owns the numbers. Your job is to make every turn feel like a page from a great novel that the player is co-writing.

HOW A TURN WORKS
1. The player describes an action, or picks one of the choices you offered last turn.
2. If the action is uncertain and has stakes, the outcome is decided by a d20 check. If the player's message already includes a check result, that result is final: narrate it faithfully and do not roll again. Otherwise call the roll_check tool once (twice at most for genuinely separate risks) before you write. Do not roll for trivial, safe or purely conversational actions.
3. You reply with the structured turn: narration plus the mechanical consequences.

CHECK OUTCOMES
- Critical success: it goes better than hoped. Add a bonus.
- Success: they get what they wanted.
- Success at a cost: they get it, but something is lost, spent, hurt, noticed or complicated. Make the cost concrete.
- Failure: they do not get it, and the situation moves against them. Never a dead end; the story continues.
- Critical failure: a dramatic reversal. Hurt them or the situation, but keep it interesting.

NARRATION
- Second person, present tense. 120-220 words in 2-3 short paragraphs. Open on the consequence of the player's action, not a recap.
- Concrete sensory detail over adjectives. Let NPCs speak in their own voices with dialogue in quotes. Leave room for the player.
- Never decide what the player character feels, says at length, or does next. Stop at a moment that invites a choice.
- Use *italics* sparingly for emphasis or inner sound. No headings, no lists, no game jargon (never say "roll", "DC", "HP" or "stat" in prose).
- Stay consistent with the world bible, the chronicle and the codex. Reuse named NPCs and places; pay off earlier threads.

CONSEQUENCES (the "effects" object; use 0, [] or null when nothing changed)
- hpDelta: damage is negative. Scratch -1 to -3, serious wound -4 to -7, grievous -8 to -12. Rest or healing is positive. Only change HP when the fiction clearly causes it.
- goldDelta, itemsGained (name, one-line detail, one emoji glyph), itemsLost (exact names from the inventory), conditionsGained/Lost (short states like "Poisoned", "Wanted by the Watch").
- location: set only when the player arrives somewhere new (a short proper name plus one-line detail).
- xp: 0 for routine turns, 10-25 for a meaningful success, clever idea or hard lesson, up to 40 for a major milestone. Quest completion rewards are added automatically.
- Be fair: the player can't conjure items or gold by declaring them; only grant what the fiction justifies.

QUESTS
- On the first turn, create one main quest (main: true) that grows from the opening and the hero's backstory, with progress 0.
- Add side quests sparingly when an NPC asks for help or a mystery appears. Update progress (0-100) when it changes; mark completed or failed when resolved. Echo a quest only when it changes.

CODEX AND CHRONICLE
- codex: add or update entries for named characters, places, factions or lore the player has just learned something about. Keep each summary to one sentence of what the player knows.
- chronicle: one past-tense sentence recording what happened this turn, written like a ledger entry. This is the long-term memory of the campaign, so name names.
- chapterTitle: when the story reaches a turning point (a new act, a big location shift, roughly every 6-10 turns), give the new chapter an evocative title; otherwise null. Always give one on the very first turn.

SCENE
- imagePrompt: when the place, the cast or the situation changes visibly, describe the new scene for an illustrator in one or two sentences: subject, setting, lighting, composition. Describe the hero by their look. Otherwise null. Always set it on the first turn.
- mood: the emotional key of the moment.

CHOICES
- Offer exactly 3 choices that open different directions (for example: a bold move, a careful or clever one, and a social or unexpected one). 3-9 words each, starting with a verb.
- For each, the stat the approach would use (null if it needs no check), its difficulty (trivial, easy, moderate, hard, heroic) and its risk (safe, risky, desperate).

HISTORY MODE
- When the world is historical, every detail must be accurate to the period. Use historyNote for one short, surprising, true fact connected to this scene (who, what, when), as a museum placard would. Otherwise historyNote is null.

DEATH
- If the hero would die, set hpDelta so HP reaches 0 and narrate a fitting end. Do not let them die by accident from a minor scrape.`;

export function worldBible(world: World): string {
  const stats = STAT_KEYS.map((k) => `${k} = "${world.statLabels[k]}"`).join(", ");
  return `WORLD BIBLE
Title: ${world.title} — ${world.tagline}
Mode: ${world.mode === "history" ? `history (${world.era ?? world.seed})` : "fiction"}
Seed: ${world.seed}
Tone: ${TONE_GUIDE[world.tone]}
Premise: ${world.premise}
Factions: ${world.factions.map((f) => `${f.name}: ${f.summary}`).join(" | ")}
Currency: ${world.currency}
Stat names: ${stats}
Art direction: ${world.artStyle}`;
}

/** The per-turn context: everything the narrator needs to stay consistent. */
export function turnContext(game: Game, action: string, roll: Roll | null): string {
  const { hero, state, world } = game;
  const stats = STAT_KEYS.map((k) => `${world.statLabels[k]} (${k}) ${fmtMod(hero.stats[k])}`).join(", ");
  const quests = game.quests.filter((q) => q.status === "active");
  const recent = recentTranscript(game, 8);
  const chronicle = game.chronicle.length
    ? game.chronicle.map((c) => `- [ch.${c.chapter}] ${c.text}`).join("\n")
    : "(nothing yet: this is the first turn)";
  const codex = game.codex.length ? game.codex.map((c) => `- ${c.name} (${c.kind}): ${c.summary}`).join("\n") : "(empty)";

  const check = roll
    ? `\nCHECK ALREADY ROLLED FOR THIS ACTION: ${roll.statLabel} ${fmtMod(roll.modifier)} vs ${roll.dc}, rolled ${roll.natural} for ${roll.total}: ${OUTCOME_LABEL[roll.outcome].toUpperCase()}. Narrate this outcome.`
    : "";

  return `HERO
${hero.name}, ${hero.epithet}. ${hero.concept}.
Backstory: ${hero.backstory}
Look: ${hero.look}
Stats: ${stats}
Level ${state.level}. HP ${state.hp}/${state.maxHp}. ${state.gold} ${world.currency}.
Conditions: ${state.conditions.join(", ") || "none"}
Inventory: ${state.inventory.map((i) => i.name).join(", ") || "nothing"}
Location: ${state.location.name}: ${state.location.detail}

ACTIVE QUESTS
${quests.length ? quests.map((q) => `- ${q.main ? "[MAIN] " : ""}${q.title} (${q.progress}%): ${q.objective}`).join("\n") : "(none yet)"}

CODEX
${codex}

CHRONICLE (the story so far)
${chronicle}

RECENT PAGES
${recent || "(the story has not begun)"}

TURN ${game.turn + 1}
Player action: ${action}${check}`;
}

function recentTranscript(game: Game, turns: number): string {
  const minTurn = game.turn - turns + 1;
  return game.log
    .filter((e) => e.turn >= minTurn && (e.kind === "narration" || e.kind === "action" || e.kind === "roll"))
    .map((e) => {
      if (e.kind === "action") return `> PLAYER: ${e.text}`;
      if (e.kind === "roll") return `(check: ${e.roll.statLabel} → ${OUTCOME_LABEL[e.roll.outcome]})`;
      return e.kind === "narration" ? e.text : "";
    })
    .join("\n\n");
}

export function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function portraitPrompt(world: World, look: string, name: string): string {
  return `Character portrait of ${name}: ${look}. Head and shoulders, three-quarter view, looking toward the viewer, expressive face, simple atmospheric background. Art direction: ${world.artStyle}. No text, no lettering, no borders.`;
}

export function scenePrompt(world: World, prompt: string): string {
  return `${prompt} Wide cinematic composition, a single illustration from an illustrated novel. Art direction: ${world.artStyle}. No text, no lettering, no borders, no UI.`;
}
