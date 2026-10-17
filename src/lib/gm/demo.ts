import type { Choice, GameMode, HeroDraft, Mood, Roll, Tone, TurnEvent, TurnRequest, TurnResolution, World } from "@/lib/types";
import { rollCheck } from "@/lib/engine/dice";
import { DIFFICULTY_DC } from "@/lib/engine/dice";

// Demo mode: a hand-written narrator so Realmweaver is playable with no API keys.
// It follows the same contract as the Claude narrator, including streamed narration.

interface DemoWorld {
  world: Omit<World, "mode" | "seed" | "tone">;
  heroes: HeroDraft[];
  beats: Beat[];
}

interface Beat {
  chapterTitle?: string;
  narration: string;
  chronicle: string;
  mood: Mood;
  imagePrompt?: string;
  location?: { name: string; detail: string };
  items?: TurnResolution["effects"]["itemsGained"];
  gold?: number;
  xp?: number;
  quests?: TurnResolution["quests"];
  codex?: TurnResolution["codex"];
  historyNote?: string;
  choices: Choice[];
}

const c = (label: string, stat: Choice["stat"], difficulty: Choice["difficulty"], risk: Choice["risk"]): Choice => ({
  label,
  stat,
  difficulty,
  risk,
});

const LANTERNS: DemoWorld = {
  world: {
    title: "The Drowned Lanterns",
    tagline: "In a city sinking into its own canals, every lantern holds a soul. Someone is stealing them.",
    premise:
      "Vael was built on the backs of a thousand bridges, and now the sea wants it back. The Lamplighters' Guild keeps the dead in glass lanterns so they can advise the living, until the lanterns begin going dark one by one.",
    artStyle:
      "Moody painterly fantasy illustration, wet cobblestones and canals, warm amber lantern light against deep teal night, soft fog, in the spirit of Craig Mullins and Studio Ghibli backgrounds",
    palette: { accent: "#f2b45a", accent2: "#6fc3c0", ink: "#0b1014" },
    statLabels: { might: "Brawn", grace: "Quickness", wits: "Lore", heart: "Nerve" },
    currency: "marks",
    factions: [
      { name: "The Lamplighters' Guild", summary: "Keepers of the soul-lanterns who quietly rule Vael through the advice of the dead." },
      { name: "The Tidewardens", summary: "Bargemen and smugglers who believe the city should be surrendered to the sea." },
      { name: "The Glass Court", summary: "Old noble houses whose ancestors burn brightest, and who have the most to lose." },
    ],
    opening:
      "The lantern of your grandmother, the city's last Archivist, has gone dark on the Bridge of Hours. You arrive as the night bells ring to find its glass cracked and a stranger's wet footprints leading into the canal.",
  },
  heroes: [
    {
      name: "Isolde Marrow",
      epithet: "the Quiet Blade",
      concept: "Disgraced guild duelist",
      backstory: "Expelled from the Lamplighters for a duel she didn't start, she still carries the guild's knife. The dark lantern was her grandmother's, and she means to find who took her.",
      look: "A lean woman in her thirties with cropped silver-streaked hair, a scarred lip and a rain-dark leather coat",
      stats: { might: 1, grace: 3, wits: 0, heart: 1 },
      kit: [
        { name: "Guild Knife", detail: "Thin, balanced, engraved with a lantern sigil.", glyph: "🗡️" },
        { name: "Oilskin Cloak", detail: "Keeps the rain and the curious eyes off.", glyph: "🧥" },
        { name: "Grandmother's Key", detail: "Opens a door in the Archive you've never seen.", glyph: "🗝️" },
      ],
    },
    {
      name: "Tobiah Fenn",
      epithet: "the Lantern Reader",
      concept: "Apprentice archivist",
      backstory: "The Archivist's last pupil, he can hear the faint voices inside lanterns when no one else can. Tonight hers stopped mid-sentence.",
      look: "A gangly young man with ink-stained fingers, round spectacles and an oversized scholar's coat",
      stats: { might: -1, grace: 1, wits: 3, heart: 2 },
      kit: [
        { name: "Listening Glass", detail: "A brass ear-trumpet tuned to the voices of the dead.", glyph: "🔭" },
        { name: "Archive Ledger", detail: "Names and dates of every lantern in Vael.", glyph: "📖" },
        { name: "Tin of Lamp Oil", detail: "Half full and smells of cloves.", glyph: "🛢️" },
      ],
    },
    {
      name: "Bram Okonkwo",
      epithet: "the Bargeman",
      concept: "Smuggler with a conscience",
      backstory: "He runs contraband for the Tidewardens and owes the Archivist his life. He saw a black barge leave the Bridge of Hours an hour ago.",
      look: "A broad, bearded man with laugh lines, a knitted cap and forearms tattooed with tide charts",
      stats: { might: 3, grace: 0, wits: 0, heart: 2 },
      kit: [
        { name: "Boat Hook", detail: "Long, iron-tipped, and good for more than boats.", glyph: "🪝" },
        { name: "Tide Charts", detail: "Every canal and when it floods.", glyph: "🗺️" },
        { name: "Flask of Rum", detail: "For courage, or for bribes.", glyph: "🍶" },
      ],
    },
  ],
  beats: [
    {
      chapterTitle: "The Bridge of Hours",
      narration:
        "Rain hisses on the Bridge of Hours. Your grandmother's lantern hangs from its iron hook like a dead star, the glass split in a perfect spiral, as if something had unscrewed it from the inside.\n\nThe footprints are still wet. They lead to the railing and stop. Below, the canal is black and slow, and a single silver scale floats on the surface, turning in the current.\n\nAcross the bridge, a Lamplighter in a hooded coat is pretending very hard not to watch you. \"Terrible business,\" she calls. \"The Guild will handle it. You should go home.\"",
      chronicle: "The Archivist's lantern was found cracked on the Bridge of Hours, with footprints leading into the canal.",
      mood: "dread",
      imagePrompt:
        "A rain-soaked stone bridge over a dark canal at night, a single cracked glass lantern hanging dark among dozens of glowing amber lanterns, a hooded figure watching from across the bridge",
      location: { name: "The Bridge of Hours", detail: "The oldest bridge in Vael, hung with a hundred soul-lanterns." },
      quests: [
        { title: "The Darkened Lantern", objective: "Find out who stole the Archivist's soul and bring her back.", status: "active", progress: 0, main: true },
      ],
      codex: [
        { kind: "place", name: "The Bridge of Hours", summary: "The oldest bridge in Vael, where the Archivist's lantern went dark." },
        { kind: "character", name: "The Hooded Lamplighter", summary: "A Guild Lamplighter who wants you gone from the bridge a little too badly." },
      ],
      choices: [
        c("Question the hooded Lamplighter", "heart", "moderate", "safe"),
        c("Fish the silver scale from the canal", "grace", "easy", "risky"),
        c("Study the spiral crack in the glass", "wits", "moderate", "safe"),
      ],
    },
    {
      narration:
        "The Lamplighter's name is Wren, and she is frightened. She pulls you under the eaves of a shuttered bakery and speaks without looking at you. \"It's the fourth this month. Always the old ones. Always the ones who knew things.\"\n\nShe presses something into your palm: a guild token stamped with a tide-wave, the Tidewardens' mark, but cast in Guild silver. \"Someone inside is working with them. I can't be seen asking. You can.\"\n\nDown the canal, a black barge slides beneath a bridge without a single light aboard.",
      chronicle: "Wren, a frightened Lamplighter, revealed that four old lanterns have been stolen and gave you a Guild-silver Tidewarden token.",
      mood: "tense",
      items: [{ name: "Silver Tide Token", detail: "A Tidewarden wave cast in Guild silver. It shouldn't exist.", glyph: "🪙" }],
      xp: 15,
      quests: [{ title: "The Darkened Lantern", objective: "Follow the black barge and learn who is stealing the old lanterns.", status: "active", progress: 20, main: true }],
      codex: [
        { kind: "character", name: "Wren", summary: "A young Lamplighter who believes a traitor inside the Guild is helping the Tidewardens." },
        { kind: "faction", name: "The Tidewardens", summary: "Their mark appears on a token made of Guild silver." },
      ],
      choices: [
        c("Chase the black barge along the quay", "grace", "hard", "risky"),
        c("Ask Wren which lanterns were taken", "heart", "easy", "safe"),
        c("Head to the Tidewarden tavern, the Drowned Bell", null, "trivial", "risky"),
      ],
    },
    {
      chapterTitle: "Under the Drowned Bell",
      narration:
        "The Drowned Bell is half underwater, as most good taverns in Vael are. You wade in through the flooded front room to find drinkers perched on tables, boots dangling over the tide.\n\nConversation stops. A woman with a tide-chart tattoo across her throat sets down her cup. \"Mother Sallow,\" someone whispers, and the room finds other places to look.\n\n\"You've got Guild silver on you,\" she says. \"I can smell it. Sit, and tell me why you're carrying my mark in their metal, before my boys decide you're a thief.\"",
      chronicle: "You entered the Drowned Bell and met Mother Sallow, the Tidewarden boss, who noticed the silver token.",
      mood: "tense",
      imagePrompt:
        "A half-flooded candlelit tavern, patrons perched on tables above dark water, a commanding older woman with a tide-chart tattoo on her throat seated at the center",
      location: { name: "The Drowned Bell", detail: "A Tidewarden tavern sunk to the knees in canal water." },
      codex: [{ kind: "character", name: "Mother Sallow", summary: "Leader of the Tidewardens, sharp-eyed and dangerous, who did not mint the silver token." }],
      xp: 10,
      choices: [
        c("Show her the token and tell the truth", "heart", "moderate", "safe"),
        c("Bluff that the Guild sent you", "heart", "hard", "desperate"),
        c("Watch the room for anyone slipping out", "wits", "moderate", "risky"),
      ],
    },
    {
      narration:
        "Mother Sallow turns the token over and her face goes still. \"This is ours, but we didn't make it. Someone's dressing Guild business in Tidewarden colors so the city blames us.\"\n\nShe leans close. \"The black barge belongs to the Glass Court. House Veyne. They've been buying old lanterns, the wise ones, and nobody's asking what for.\"\n\nShe slides a waxed map across the table, the route of the barge marked in grease pencil, ending at the Veyne family crypt on the Isle of Glass.",
      chronicle: "Mother Sallow revealed the token is a frame-up and that House Veyne of the Glass Court owns the black barge.",
      mood: "wonder",
      items: [{ name: "Waxed Barge Map", detail: "The black barge's route to the Veyne crypt on the Isle of Glass.", glyph: "🗺️" }],
      xp: 20,
      quests: [
        { title: "The Darkened Lantern", objective: "Reach the Veyne crypt on the Isle of Glass.", status: "active", progress: 50, main: true },
        { title: "Clear the Tidewardens' Name", objective: "Find proof that House Veyne forged the silver tokens.", status: "active", progress: 0, main: false },
      ],
      codex: [
        { kind: "faction", name: "House Veyne", summary: "A Glass Court house that owns the black barge and has been collecting wise lanterns." },
        { kind: "place", name: "The Isle of Glass", summary: "Where the old houses entomb their dead, and where the barge's route ends." },
      ],
      choices: [
        c("Borrow a skiff and row for the Isle", "might", "moderate", "risky"),
        c("Ask Sallow for a crew to come with you", "heart", "hard", "safe"),
        c("Read the map's margins for hidden notes", "wits", "easy", "safe"),
      ],
    },
    {
      chapterTitle: "The Isle of Glass",
      narration:
        "The Isle of Glass rises out of the fog like a chandelier dropped into the sea. Every tomb is a greenhouse of lanterns, and every lantern glows.\n\nExcept the Veyne crypt. Its doors stand open, and inside, dozens of stolen lanterns hang in a ring around a great brass engine, their light being drawn into it in thin, trembling threads. One of them, flickering weakly, is your grandmother's.\n\nAt the engine's controls stands Lord Casimir Veyne, very old and very calm. \"Ah,\" he says. \"The Archivist's family. She did warn me you'd come.\"",
      chronicle: "In the Veyne crypt you found the stolen lanterns feeding a brass engine run by Lord Casimir Veyne.",
      mood: "dread",
      imagePrompt:
        "A crypt of glowing glass lanterns arranged in a ring around a towering brass engine drawing threads of light from them, an elderly aristocrat at the controls, fog spilling through open doors",
      location: { name: "The Veyne Crypt", detail: "A glass tomb on the Isle of Glass, home to a soul-drinking engine." },
      xp: 25,
      quests: [{ title: "The Darkened Lantern", objective: "Stop Lord Veyne's engine and free your grandmother's soul.", status: "active", progress: 80, main: true }],
      codex: [{ kind: "character", name: "Lord Casimir Veyne", summary: "An ancient noble draining wise souls into a brass engine, who knew your grandmother." }],
      choices: [
        c("Smash the engine's central valve", "might", "hard", "desperate"),
        c("Ask Veyne what the engine is for", "heart", "moderate", "safe"),
        c("Reach for grandmother's lantern", "grace", "hard", "risky"),
      ],
    },
  ],
};

const NEON: DemoWorld = {
  world: {
    title: "Neon Requiem",
    tagline: "Memories are currency in Lowtown. Yours were just stolen.",
    premise:
      "In the rain-drowned arcology of Sable City, people sell memories to pay rent and buy other people's to feel something. You woke up this morning missing three days and holding a stranger's gun.",
    artStyle:
      "Cinematic cyberpunk concept art, rain-slick streets, magenta and cyan neon reflections, volumetric haze, in the spirit of Syd Mead and Blade Runner 2049",
    palette: { accent: "#ff4fa3", accent2: "#3ee6ff", ink: "#090812" },
    statLabels: { might: "Chrome", grace: "Ghost", wits: "Signal", heart: "Soul" },
    currency: "creds",
    factions: [
      { name: "Mnemos Corp", summary: "Owns the memory exchange and quietly edits what the city remembers." },
      { name: "The Static", summary: "Hackers who leak stolen memories back to the people they came from." },
      { name: "Lowtown Saints", summary: "A street church that guards the poor and runs the black-market clinics." },
    ],
    opening:
      "You wake in a capsule hotel with a three-day gap in your memory and a stranger's gun in your hand. Your wrist display shows one new message: \"Don't trust your own face.\"",
  },
  heroes: [
    {
      name: "Kai Moreno",
      epithet: "the Burned Courier",
      concept: "Memory runner with a fried implant",
      backstory: "You run stolen memories across town in a skull-socket courier rig. Someone used your rig while you were out, and the memory they moved is worth killing for.",
      look: "A wiry person in their twenties with a shaved undercut, a glowing socket behind one ear and a battered yellow raincoat",
      stats: { might: 0, grace: 3, wits: 1, heart: 1 },
      kit: [
        { name: "Courier Rig", detail: "Skull-socket memory carrier, slightly scorched.", glyph: "🧠" },
        { name: "Stranger's Pistol", detail: "Smart-gun, keyed to someone else's hand.", glyph: "🔫" },
        { name: "Burner Deck", detail: "A cheap, untraceable cyberdeck.", glyph: "💻" },
      ],
    },
    {
      name: "Dr. Ines Achterberg",
      epithet: "the Back-Alley Surgeon",
      concept: "Unlicensed implant doctor",
      backstory: "You patch up Lowtown for the Saints. Three days ago you operated on someone you can't remember, and now your clinic's been torn apart.",
      look: "A tired woman in her fifties with steel-grey braids, augmented surgical fingers and a blood-flecked lab coat over a church scarf",
      stats: { might: 0, grace: 0, wits: 3, heart: 2 },
      kit: [
        { name: "Surgical Fingers", detail: "Ten precise augmented digits.", glyph: "🦾" },
        { name: "Medkit", detail: "Stims, sealant, and a little morphine.", glyph: "💉" },
        { name: "Saint's Scarf", detail: "Opens doors in Lowtown.", glyph: "🧣" },
      ],
    },
    {
      name: "Rook",
      epithet: "the Static Ghost",
      concept: "Hacker of the Static",
      backstory: "You leak stolen memories back to their owners. The Static says you went dark for three days and came back with Mnemos credentials.",
      look: "An androgynous figure with mirrored contact lenses, chrome-threaded hair and an oversized hoodie covered in glitch art",
      stats: { might: -1, grace: 2, wits: 3, heart: 1 },
      kit: [
        { name: "Spike Deck", detail: "Military-grade intrusion rig.", glyph: "💾" },
        { name: "Mnemos Keycard", detail: "Corporate credentials you don't remember stealing.", glyph: "🪪" },
        { name: "Glitch Mask", detail: "Scrambles facial recognition.", glyph: "🎭" },
      ],
    },
  ],
  beats: [
    {
      chapterTitle: "Three Missing Days",
      narration:
        "The capsule hums around you like a coffin with good wifi. Rain drums on the roof forty floors up, and the gun in your hand is warm, recently fired.\n\nYour wrist display blinks: **Don't trust your own face.** The sender is you, timestamped two days ago.\n\nOutside the capsule, footsteps stop. A voice, polite and synthetic: \"Hotel security. We've had a report of a disturbance. Please open the hatch.\" Hotel security in Lowtown does not say please.",
      chronicle: "You woke in a capsule hotel missing three days, holding a fired gun, with a warning from yourself.",
      mood: "tense",
      imagePrompt:
        "Inside a cramped neon-lit capsule hotel pod, a figure clutching a pistol, rain streaking a tiny window showing a towering cyberpunk city, magenta and cyan light",
      location: { name: "Hive 40 Capsule Hotel", detail: "Forty floors of sleeping pods stacked above Lowtown." },
      quests: [{ title: "Three Missing Days", objective: "Find out what you did, and who took the memory of it.", status: "active", progress: 0, main: true }],
      codex: [{ kind: "place", name: "Hive 40", summary: "A capsule hotel where you woke with no memory of the last three days." }],
      choices: [
        c("Kick the hatch into the guard", "might", "moderate", "risky"),
        c("Slip out the maintenance panel", "grace", "moderate", "risky"),
        c("Talk your way past security", "heart", "hard", "safe"),
      ],
    },
    {
      narration:
        "You drop into the service shaft as the hatch hisses open above you. Through the grille you glimpse them: two Mnemos enforcers in mirrored helmets, scanning your empty pod.\n\nOne of them holds up a photo for the other. It's your face. But the name under it isn't yours.\n\nThe shaft spits you into an alley full of noodle steam and neon. Your burner buzzes: an anonymous ping with coordinates to a church called St. Static of the Rain. *Come alone. Bring the gun.*",
      chronicle: "You escaped Mnemos enforcers who carried your photo under someone else's name.",
      mood: "tense",
      xp: 15,
      quests: [{ title: "Three Missing Days", objective: "Meet the anonymous contact at St. Static of the Rain.", status: "active", progress: 25, main: true }],
      codex: [{ kind: "faction", name: "Mnemos Corp", summary: "Their enforcers are hunting you under a name that isn't yours." }],
      choices: [
        c("Go straight to the church", null, "trivial", "risky"),
        c("Scrub the gun's ownership chip first", "wits", "moderate", "safe"),
        c("Shadow the enforcers instead", "grace", "hard", "desperate"),
      ],
    },
    {
      chapterTitle: "St. Static of the Rain",
      narration:
        "The church is a converted server farm, pews between humming racks, candles burning beside cooling fans. A hologram of a saint flickers above the altar, mouth moving in looped static.\n\nA woman in a Saints' scarf waits in the front pew. \"You don't remember me,\" she says. \"That's fine. I remember you. Three days ago you stole the founding memory of Mnemos Corp, the one that proves the city's first memory exchange was built on stolen minds.\"\n\nShe holds out her hand. \"And then someone stole it back out of your head.\"",
      chronicle: "At St. Static of the Rain, a Saint told you that you stole Mnemos Corp's founding memory before it was taken from you.",
      mood: "wonder",
      imagePrompt:
        "A converted server-farm church, candlelit pews between glowing server racks, a flickering holographic saint above the altar, a woman in a red scarf waiting in the front pew",
      location: { name: "St. Static of the Rain", detail: "A server farm turned church in the heart of Lowtown." },
      xp: 20,
      quests: [{ title: "Three Missing Days", objective: "Recover the founding memory of Mnemos Corp.", status: "active", progress: 50, main: true }],
      codex: [
        { kind: "character", name: "Sister Vey", summary: "A Lowtown Saint who knew you before your memory was stolen." },
        { kind: "lore", name: "The Founding Memory", summary: "Proof that Mnemos Corp was built on stolen minds, which you once had." },
      ],
      choices: [
        c("Ask who could have pulled it from you", "heart", "easy", "safe"),
        c("Let her scan your implant for traces", "wits", "moderate", "risky"),
        c("Demand proof she's telling the truth", "heart", "moderate", "risky"),
      ],
    },
    {
      narration:
        "The scan finds a ghost-trace: a buyer's signature burned into your implant like a fingerprint on glass. The buyer is a memory broker called Lacuna who runs an auction every night at the Mirror Market.\n\nSister Vey presses a slip of chrome into your hand. \"An invitation. Lacuna sells to Mnemos tonight. If the founding memory goes back into the vault, the city forgets forever.\"\n\nOutside, sirens start, then stop, much too close.",
      chronicle: "A trace in your implant pointed to Lacuna, a broker selling the founding memory to Mnemos at the Mirror Market tonight.",
      mood: "tense",
      items: [{ name: "Mirror Market Invitation", detail: "A chrome slip that opens Lacuna's auction.", glyph: "🎟️" }],
      xp: 15,
      quests: [{ title: "Three Missing Days", objective: "Stop Lacuna's sale at the Mirror Market.", status: "active", progress: 70, main: true }],
      codex: [{ kind: "character", name: "Lacuna", summary: "A memory broker who bought your stolen memory and sells to Mnemos tonight." }],
      choices: [
        c("Head for the Mirror Market now", null, "trivial", "risky"),
        c("Ask the Static to crash the auction", "heart", "hard", "safe"),
        c("Lure the sirens away from the church", "grace", "moderate", "desperate"),
      ],
    },
    {
      chapterTitle: "The Mirror Market",
      narration:
        "The Mirror Market fills an abandoned mall, every storefront a mirror, every buyer masked. Lacuna stands on the dead fountain in a coat made of shattered screens, holding up a glowing vial of memory.\n\n\"Lot seventeen,\" Lacuna purrs. \"A founding memory. Rare. Dangerous. Opening bid: one million creds.\"\n\nIn every mirror you see yourself, and in one of them, your reflection is wearing a Mnemos badge and smiling back at you.",
      chronicle: "At the Mirror Market, Lacuna began auctioning the founding memory, and your reflection appeared wearing a Mnemos badge.",
      mood: "dread",
      imagePrompt:
        "An abandoned mall turned into a masked auction, every storefront a mirror, a figure in a coat of shattered screens holding a glowing vial atop a dry fountain, neon reflections everywhere",
      location: { name: "The Mirror Market", detail: "A dead mall of mirrors where memories are auctioned." },
      xp: 25,
      quests: [{ title: "Three Missing Days", objective: "Take the founding memory before Mnemos wins the bid.", status: "active", progress: 85, main: true }],
      choices: [
        c("Snatch the vial from Lacuna", "grace", "hard", "desperate"),
        c("Outbid Mnemos with a bluff", "heart", "hard", "risky"),
        c("Confront your smiling reflection", "wits", "moderate", "risky"),
      ],
    },
  ],
};

const FLORENCE: DemoWorld = {
  world: {
    title: "The Medici Gambit",
    tagline: "Lorenzo the Magnificent is dying. Florence is about to change hands.",
    premise:
      "April 1492. Lorenzo de' Medici lies ill at his villa in Careggi, and the friar Savonarola preaches that God's punishment is coming. Bankers, artists and assassins all know that whoever holds Florence next will shape the age.",
    artStyle:
      "Italian Renaissance oil painting, warm umber and gold, soft chiaroscuro, detailed architecture, in the manner of Ghirlandaio's Florentine frescoes",
    palette: { accent: "#e2ab4a", accent2: "#c2543a", ink: "#120d0a" },
    statLabels: { might: "Vigor", grace: "Finesse", wits: "Learning", heart: "Charm" },
    currency: "florins",
    factions: [
      { name: "House Medici", summary: "The banking family that has ruled Florence behind republican masks for sixty years." },
      { name: "The Piagnoni", summary: "Followers of the friar Savonarola, who preach repentance and the burning of vanities." },
      { name: "The Pazzi Remnant", summary: "Survivors of the 1478 conspiracy against the Medici, waiting for revenge." },
    ],
    opening:
      "It is the morning of 5 April 1492, and lightning has just struck the lantern of the Duomo, sending marble crashing into the piazza. The crowd is calling it an omen, and a dying man's letter has been pressed into your hands.",
    era: "1492, Florence",
  },
  heroes: [
    {
      name: "Giulia Bardi",
      epithet: "the Banker's Daughter",
      concept: "Clerk at the Medici bank",
      backstory: "Your father keeps the Medici ledgers and has just vanished. The letter in your hands is in his handwriting.",
      look: "A young woman in a sober green gamurra with ink-stained cuffs, auburn hair under a linen veil",
      stats: { might: 0, grace: 1, wits: 3, heart: 1 },
      kit: [
        { name: "Abacus", detail: "Walnut and brass, worn smooth by use.", glyph: "🧮" },
        { name: "Bill of Exchange", detail: "Worth 50 florins at any Medici branch.", glyph: "📜" },
        { name: "Father's Letter", detail: "Sealed, urgent, unfinished.", glyph: "✉️" },
      ],
    },
    {
      name: "Matteo di Lapo",
      epithet: "the Apprentice",
      concept: "Sculptor's apprentice in the Medici garden",
      backstory: "You study beside a moody teenage prodigy named Michelangelo in Lorenzo's sculpture garden. Your master told you to deliver this letter and tell no one.",
      look: "A dusty young man with marble powder in his curls, broad shoulders and a chisel tucked behind one ear",
      stats: { might: 2, grace: 1, wits: 0, heart: 2 },
      kit: [
        { name: "Chisel Set", detail: "Iron chisels in a leather roll.", glyph: "⚒️" },
        { name: "Sketchbook", detail: "Studies of hands and statues.", glyph: "✏️" },
        { name: "Garden Pass", detail: "Lets you into the Medici sculpture garden.", glyph: "🏛️" },
      ],
    },
    {
      name: "Fra Tommaso",
      epithet: "the Doubting Friar",
      concept: "Dominican friar at San Marco",
      backstory: "You live in the same convent as Savonarola and fear where his sermons are leading. A dying penitent gave you this letter during confession.",
      look: "A gaunt middle-aged friar in a black and white Dominican habit with kind, tired eyes",
      stats: { might: -1, grace: 1, wits: 2, heart: 3 },
      kit: [
        { name: "Breviary", detail: "Prayers for every hour.", glyph: "📕" },
        { name: "Rosary", detail: "Olive wood, from the Holy Land.", glyph: "📿" },
        { name: "Key to the Library", detail: "San Marco's library, Cosimo's gift.", glyph: "🗝️" },
      ],
    },
  ],
  beats: [
    {
      chapterTitle: "Lightning on the Duomo",
      narration:
        "Marble dust still hangs over the Piazza del Duomo. A great chunk of Brunelleschi's lantern lies cracked on the paving stones where it fell, and around it the crowd mutters about omens and the wrath of God.\n\nThe letter in your hands is sealed with plain wax and addressed, in a shaking hand, *To be given to Lorenzo alone, at Careggi.* Beneath the seal, the paper is faintly stained with something that smells of bitter almonds.\n\nA black-robed Piagnone is already preaching from the cathedral steps: \"The Lord has struck the tyrant's house!\"",
      chronicle: "On 5 April 1492 lightning struck the Duomo's lantern, and you were left holding a sealed letter meant for the dying Lorenzo.",
      mood: "dread",
      imagePrompt:
        "The Piazza del Duomo in Florence in 1492, a broken piece of white marble lantern on the paving, a startled Renaissance crowd, a black-robed preacher on the cathedral steps, storm light",
      location: { name: "Piazza del Duomo", detail: "The cathedral square, scattered with fallen marble." },
      historyNote:
        "Lightning really did strike the lantern of Florence Cathedral on 5 April 1492. Three days later Lorenzo de' Medici died, and many Florentines saw the strike as an omen of his death.",
      quests: [{ title: "The Letter for Lorenzo", objective: "Deliver the sealed letter to Lorenzo de' Medici at Careggi.", status: "active", progress: 0, main: true }],
      codex: [
        { kind: "place", name: "Piazza del Duomo", summary: "Where lightning struck Brunelleschi's lantern on 5 April 1492." },
        { kind: "character", name: "Lorenzo de' Medici", summary: "The ailing ruler of Florence, waiting at his villa in Careggi." },
      ],
      choices: [
        c("Hire a horse and ride for Careggi", "might", "easy", "risky"),
        c("Examine the almond-scented stain", "wits", "moderate", "safe"),
        c("Listen to what the preacher is saying", "heart", "easy", "safe"),
      ],
    },
    {
      narration:
        "The stain is no accident. The scent of bitter almonds clings to the wax itself, the mark of a poisoner who wanted the letter's reader to die before finishing it.\n\nYou turn the seal to the light and find a tiny device pressed into the wax: two dolphins, back to back. The arms of the Pazzi, the family the Medici all but erased after the conspiracy of 1478.\n\nA hand falls on your shoulder. A man in Medici livery, polite and unsmiling. \"Messer Poliziano would very much like to see that letter.\"",
      chronicle: "You discovered the letter's seal was poisoned and bore the Pazzi dolphins, then were approached by a Medici servant.",
      mood: "tense",
      xp: 15,
      historyNote:
        "In the Pazzi Conspiracy of 26 April 1478, assassins attacked Lorenzo and his brother Giuliano during Mass in the Duomo. Giuliano was killed; Lorenzo escaped wounded.",
      quests: [{ title: "The Letter for Lorenzo", objective: "Find out who poisoned the letter before it reaches Lorenzo.", status: "active", progress: 25, main: true }],
      codex: [{ kind: "faction", name: "The Pazzi Remnant", summary: "Their dolphin crest is pressed into the poisoned seal." }],
      choices: [
        c("Go with the servant to Poliziano", null, "trivial", "safe"),
        c("Slip away into the crowd", "grace", "moderate", "risky"),
        c("Ask to see the servant's papers", "heart", "moderate", "risky"),
      ],
    },
    {
      chapterTitle: "The Poet's Study",
      narration:
        "Angelo Poliziano receives you in a study stacked to the ceiling with Greek manuscripts. He is the finest poet in Italy and the tutor of Lorenzo's sons, and right now he looks like a man who hasn't slept in a week.\n\n\"Lorenzo is dying,\" he says simply. \"The physicians give him days. If that letter carries poison, someone means to hurry the end and take the city before Piero can hold it.\"\n\nHe unrolls a list of names. \"These men have met in secret at Santo Spirito. I need someone the Medici don't own to go and listen.\"",
      chronicle: "Angelo Poliziano asked you to spy on a secret meeting at Santo Spirito.",
      mood: "tense",
      imagePrompt:
        "A Renaissance scholar's study piled with Greek manuscripts, candlelight, a tired poet in dark robes unrolling a list of names across a wooden desk",
      location: { name: "Palazzo Medici", detail: "The family palace on the Via Larga, now tense with waiting." },
      xp: 15,
      quests: [
        { title: "The Letter for Lorenzo", objective: "Uncover the plot before Lorenzo dies.", status: "active", progress: 40, main: true },
        { title: "Whispers at Santo Spirito", objective: "Spy on the secret meeting in the church of Santo Spirito.", status: "active", progress: 0, main: false },
      ],
      codex: [
        { kind: "character", name: "Angelo Poliziano", summary: "Poet and tutor to the Medici sons, loyal to Lorenzo and desperate." },
        { kind: "character", name: "Piero de' Medici", summary: "Lorenzo's heir, whom Poliziano fears cannot hold the city." },
      ],
      historyNote:
        "Poliziano tutored Lorenzo's children, including Giovanni, who later became Pope Leo X. Piero, the eldest, was expelled from Florence just two years after Lorenzo's death.",
      choices: [
        c("Accept and go to Santo Spirito", null, "trivial", "risky"),
        c("Ask why he trusts you", "heart", "easy", "safe"),
        c("Read the list for names you know", "wits", "moderate", "safe"),
      ],
    },
    {
      narration:
        "Santo Spirito is still unfinished, Brunelleschi's columns marching into scaffolding and shadow. Behind the sacristy, voices: three men in plain cloaks, and one in a Dominican habit.\n\n\"When Lorenzo dies, the friar's people will fill the streets,\" one says. \"In the confusion, the Signoria can be bought.\" A purse clinks. \"And the letter?\"\n\n\"Delivered by a fool who doesn't know what it is,\" another laughs. Then, closer: \"Did you hear something?\"",
      chronicle: "At Santo Spirito you overheard conspirators planning to buy the Signoria in the chaos after Lorenzo's death.",
      mood: "dread",
      imagePrompt:
        "The unfinished interior of Santo Spirito church in Florence, grey stone columns and wooden scaffolding, cloaked conspirators whispering by candlelight near the sacristy",
      location: { name: "Santo Spirito", detail: "Brunelleschi's last church, still wrapped in scaffolding." },
      xp: 20,
      quests: [
        { title: "Whispers at Santo Spirito", objective: "Escape with what you heard.", status: "active", progress: 70, main: false },
        { title: "The Letter for Lorenzo", objective: "Warn the Medici before the conspirators move.", status: "active", progress: 60, main: true },
      ],
      codex: [{ kind: "place", name: "Santo Spirito", summary: "An unfinished church where conspirators plotted to buy the Signoria." }],
      historyNote:
        "Santo Spirito was Brunelleschi's final design. He died in 1446 when only one column stood; the church was completed around 1487, though work on the facade never finished.",
      choices: [
        c("Hold still in the shadows", "grace", "hard", "risky"),
        c("Step out and confront them", "heart", "heroic", "desperate"),
        c("Knock over scaffolding and run", "might", "moderate", "risky"),
      ],
    },
    {
      chapterTitle: "Careggi",
      narration:
        "The villa at Careggi smells of rosemary and illness. Lorenzo de' Medici lies propped on pillows, his face grey, his eyes still sharp as a merchant's. Pico della Mirandola sits by the window reading him Greek.\n\n\"So,\" Lorenzo says, looking at the letter in your hand. \"Someone wants me dead faster than God does.\" He almost laughs. \"Read it to me. Don't touch the seal.\"\n\nDown the hall, voices rise. Someone has come demanding to see the dying man: Fra Girolamo Savonarola.",
      chronicle: "You reached Lorenzo at Careggi, who asked you to read him the letter as Savonarola arrived.",
      mood: "sorrow",
      imagePrompt:
        "A dim Renaissance bedchamber at the villa of Careggi, a gaunt dying nobleman propped on pillows, a young scholar reading by the window, warm candlelight and rosemary",
      location: { name: "Villa Medici at Careggi", detail: "The Medici country villa where Lorenzo lies dying." },
      xp: 25,
      quests: [{ title: "The Letter for Lorenzo", objective: "Read Lorenzo the letter and face what it reveals.", status: "active", progress: 85, main: true }],
      codex: [
        { kind: "character", name: "Pico della Mirandola", summary: "The brilliant philosopher keeping vigil at Lorenzo's side." },
        { kind: "character", name: "Girolamo Savonarola", summary: "The fiery friar of San Marco, who has come to the dying Lorenzo." },
      ],
      historyNote:
        "Savonarola did visit Lorenzo's deathbed at Careggi. Accounts differ on what passed between them; one story holds that the friar refused absolution unless Lorenzo restored Florence's liberty.",
      choices: [
        c("Break the seal carefully and read", "grace", "moderate", "risky"),
        c("Bar the door against Savonarola", "might", "moderate", "risky"),
        c("Ask Lorenzo who he suspects", "heart", "easy", "safe"),
      ],
    },
  ],
};

const LEADS: Record<Roll["outcome"], string[]> = {
  critical: ["Everything lines up at once, cleaner than you dared hope.", "For one perfect moment the world moves at your pace."],
  success: ["It works, and you feel the moment tilt your way.", "You pull it off with steady hands."],
  partial: ["You manage it, though not cleanly, and something slips in the process.", "It works, but it costs you more than you'd like."],
  failure: ["It goes wrong almost at once.", "You misjudge it, and the moment turns against you."],
  fumble: ["It goes badly wrong, all at once.", "Disaster, quick and loud."],
};

function pickDemo(mode: GameMode, seed: string): DemoWorld {
  if (mode === "history") return FLORENCE;
  if (/cyber|neon|space|star|robot|future|mech|hack|android|sci|blade|matrix|corp/i.test(seed)) return NEON;
  return LANTERNS;
}

export function demoWorld(mode: GameMode, seed: string, tone: Tone): { world: World; heroes: HeroDraft[] } {
  const demo = pickDemo(mode, seed);
  return { world: { ...demo.world, mode, seed, tone }, heroes: demo.heroes };
}

function demoFor(world: World): DemoWorld {
  return [LANTERNS, NEON, FLORENCE].find((d) => d.world.title === world.title) ?? LANTERNS;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function* runDemoTurn({ game, action, roll }: TurnRequest): AsyncGenerator<TurnEvent> {
  const demo = demoFor(game.world);
  const beatIndex = Math.min(game.turn, demo.beats.length);
  let check = roll;

  // Free-text actions on later turns get a check, like the real narrator would.
  if (!check && game.turn > 0 && !/^(look|wait|rest|talk|ask|listen)/i.test(action)) {
    const stat = (["might", "grace", "wits", "heart"] as const)[game.turn % 4];
    check = rollCheck({
      stat,
      statLabel: game.world.statLabels[stat],
      modifier: game.hero.stats[stat],
      dc: DIFFICULTY_DC.moderate,
      reason: action.slice(0, 80),
    });
    await sleep(500);
    yield { type: "roll", roll: check };
  }

  const resolution = beatIndex < demo.beats.length ? fromBeat(demo.beats[beatIndex], check) : freeform(game.world, action, check, game.turn);

  await sleep(700);
  const words = resolution.narration.split(/(\s+)/);
  let text = "";
  for (let i = 0; i < words.length; i++) {
    text += words[i];
    if (i % 6 === 5) {
      yield { type: "narration", text };
      await sleep(45);
    }
  }
  yield { type: "narration", text: resolution.narration };
  yield { type: "resolution", resolution };
}

function lead(roll: Roll | null): string {
  if (!roll) return "";
  const options = LEADS[roll.outcome];
  return options[roll.natural % options.length] + "\n\n";
}

function setback(roll: Roll | null): { hp: number; condition: string[] } {
  if (!roll) return { hp: 0, condition: [] };
  if (roll.outcome === "fumble") return { hp: -6, condition: ["Shaken"] };
  if (roll.outcome === "failure") return { hp: -3, condition: [] };
  if (roll.outcome === "partial") return { hp: -1, condition: [] };
  return { hp: 0, condition: [] };
}

function fromBeat(beat: Beat, roll: Roll | null): TurnResolution {
  const hurt = setback(roll);
  const bonus = roll?.outcome === "critical" ? 10 : 0;
  return {
    narration: lead(roll) + beat.narration,
    chapterTitle: beat.chapterTitle ?? null,
    chronicle: beat.chronicle,
    effects: {
      hpDelta: hurt.hp,
      goldDelta: (beat.gold ?? 0) + (roll?.outcome === "critical" ? 5 : 0),
      xp: (beat.xp ?? 0) + bonus,
      itemsGained: beat.items ?? [],
      itemsLost: [],
      conditionsGained: hurt.condition,
      conditionsLost: [],
      location: beat.location ?? null,
    },
    quests: beat.quests ?? [],
    codex: beat.codex ?? [],
    scene: { imagePrompt: beat.imagePrompt ?? null, mood: beat.mood },
    historyNote: beat.historyNote ?? null,
    choices: beat.choices,
  };
}

function freeform(world: World, action: string, roll: Roll | null, turn: number): TurnResolution {
  const hurt = setback(roll);
  const faction = world.factions[turn % Math.max(1, world.factions.length)]?.name ?? "the powers of this place";
  return {
    narration:
      lead(roll) +
      `You act, and the world answers. Word of what you've done travels faster than you do, and by nightfall ${faction} knows your name.\n\nThis is where the demo's hand-written pages run out. Add an ANTHROPIC_API_KEY and the Weaver will take it from here, remembering every name, debt and promise so far.`,
    chapterTitle: null,
    chronicle: `You pressed on: ${action.slice(0, 80)}.`,
    effects: {
      hpDelta: hurt.hp,
      goldDelta: 0,
      xp: 10,
      itemsGained: [],
      itemsLost: [],
      conditionsGained: hurt.condition,
      conditionsLost: [],
      location: null,
    },
    quests: [],
    codex: [],
    scene: { imagePrompt: null, mood: "calm" },
    historyNote: null,
    choices: [c("Press on into the night", "might", "moderate", "risky"), c("Look for allies", "heart", "easy", "safe"), c("Think it through", "wits", "easy", "safe")],
  };
}
