export interface CharacterStats {
  [key: string]: number;
}

export interface Persona {
  name: string;
  backstory: string;
  stats: CharacterStats;
  portraitUrl?: string;
  imageStyle?: string;
}

export interface GameState {
  hp: number;
  maxHp: number;
  inventory: string[];
  location: string;
  stats: CharacterStats;
  gold: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface LLMResponse {
  narrative: string;
  state_updates: Partial<GameState>;
  image_prompt: string | null;
}

export interface PersonaProposal {
  name: string;
  backstory: string;
  stats: CharacterStats;
  image_style?: string;
}

export type GamePhase = "menu" | "universe" | "persona" | "playing" | "load";

export type GameMode = "fictional" | "historical";

export interface UniverseConfig {
  mode: GameMode;
  setting: string;
}

export interface ChatApiRequest {
  messages: ChatMessage[];
  gameState: GameState;
  persona: Persona;
  universe: string;
  gameMode: GameMode;
  storySummary: string;
  phase: "persona_generate" | "persona_modify" | "game_turn";
  userInput?: string;
}

export interface ChatApiResponse {
  narrative: string;
  stateUpdates?: Partial<GameState>;
  imagePrompt?: string | null;
  persona?: PersonaProposal;
  imageStyle?: string;
  storySummary?: string;
  tokensRemaining?: number;
}

export interface ImageApiRequest {
  prompt: string;
}

export interface ImageApiResponse {
  imageUrl: string;
}
