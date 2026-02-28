import type { GameState, Persona, ChatMessage } from "@/types/game";

export function buildPersonaGenerationPrompt(universe: string): string {
  return `You are a creative RPG game master. The player has chosen the following universe/setting for their adventure:

"${universe}"

Generate a unique character persona for this universe. Return ONLY a valid JSON object with this exact structure:
{
  "name": "character name",
  "backstory": "A compelling 2-3 sentence backstory",
  "stats": {
    "stat_name_1": number_between_1_and_20,
    "stat_name_2": number_between_1_and_20,
    "stat_name_3": number_between_1_and_20
  }
}

Choose 3 stats that are thematically appropriate for the universe. For example, a fantasy setting might use "Strength", "Intelligence", "Charisma", while a sci-fi setting might use "Tech", "Piloting", "Diplomacy".

Return ONLY the JSON, no markdown fences, no extra text.`;
}

export function buildPersonaModificationPrompt(
  universe: string,
  currentPersona: string,
  userRequest: string
): string {
  return `You are a creative RPG game master. The player is customizing their character for this universe:

"${universe}"

Current character:
${currentPersona}

The player wants to make these changes: "${userRequest}"

Apply the requested changes and return the updated character as ONLY a valid JSON object:
{
  "name": "character name",
  "backstory": "A compelling 2-3 sentence backstory",
  "stats": {
    "stat_name_1": number_between_1_and_20,
    "stat_name_2": number_between_1_and_20,
    "stat_name_3": number_between_1_and_20
  }
}

Return ONLY the JSON, no markdown fences, no extra text.`;
}

export function buildGameSystemPrompt(
  universe: string,
  persona: Persona,
  gameState: GameState,
  storySummary: string
): string {
  return `You are an immersive RPG game master running a text adventure set in this universe:

"${universe}"

PLAYER CHARACTER:
Name: ${persona.name}
Backstory: ${persona.backstory}
Stats: ${JSON.stringify(persona.stats)}

CURRENT GAME STATE:
HP: ${gameState.hp}/${gameState.maxHp}
Gold: ${gameState.gold}
Location: ${gameState.location}
Inventory: ${gameState.inventory.length > 0 ? gameState.inventory.join(", ") : "Empty"}
Stats: ${JSON.stringify(gameState.stats)}

STORY SO FAR:
${storySummary || "The adventure is just beginning."}

RULES:
1. You MUST respond with ONLY a valid JSON object, no markdown fences, no extra text.
2. Write vivid, engaging narrative text (2-4 paragraphs) that responds to the player's action.
3. Update game state based on what happens (items found/lost, HP changes, location changes, stat changes, gold changes).
4. Set image_prompt to a vivid visual scene description whenever the location changes, a major event occurs, a new NPC appears, or combat begins. The image_prompt should describe the SCENE visually (environment, lighting, mood, key elements) in 1-2 sentences. Set to null ONLY for minor dialogue or inventory actions where nothing visual changes.
5. Keep HP between 0 and ${gameState.maxHp}. If HP reaches 0, narrate the character's defeat.
6. Be fair but challenging. Use the character's stats to determine success/failure of skill checks.
7. IMPORTANT: For the very first turn, you MUST set image_prompt to describe the opening scene. Always provide an image_prompt when the player enters a new area.

RESPONSE FORMAT (strict JSON):
{
  "narrative": "Your story text here. Use vivid descriptions.",
  "state_updates": {
    "hp": <number>,
    "inventory": [<list of all current items>],
    "location": "<current location name>",
    "gold": <number>,
    "stats": {<updated stats if any change>}
  },
  "image_prompt": "<scene description for illustration>" or null
}

Return ONLY the JSON object.`;
}

export function buildSummaryPrompt(
  currentSummary: string,
  recentMessages: ChatMessage[]
): string {
  const recentText = recentMessages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  return `Condense the following RPG adventure summary and recent events into a concise summary (max 200 words) that captures key plot points, important decisions, and current objectives.

PREVIOUS SUMMARY:
${currentSummary || "None yet."}

RECENT EVENTS:
${recentText}

Return ONLY the summary text, no JSON, no extra formatting.`;
}

export function buildPortraitPrompt(persona: Persona, universe: string): string {
  const statDescriptions = Object.entries(persona.stats)
    .map(([stat, val]) => {
      if (val >= 15) return `very high ${stat}`;
      if (val <= 7) return `low ${stat}`;
      return `moderate ${stat}`;
    })
    .join(", ");

  return `Portrait of ${persona.name}, an RPG character from the universe "${universe}". ${persona.backstory}. They appear to have ${statDescriptions}. Close-up character portrait, facing the viewer`;
}
