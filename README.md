# Realm Weaver — AI Text Adventure RPG

A split-screen text-based adventure RPG powered by Google's Gemini AI. Choose any universe, create a unique character, and embark on an AI-driven quest with dynamic illustrations.

## Features

- **Any Universe** — Enter any setting (Lord of the Rings, Cyberpunk 2077, your own creation) and the AI builds a world around it
- **AI Character Creation** — Gemini generates a unique persona with backstory and thematic stats; modify freely before starting
- **Split-Screen Gameplay** — Chat narrative on the left, AI-generated scene illustrations on the right
- **Dynamic State Management** — HP, inventory, gold, location, and stats update automatically based on the narrative
- **Consistent Art Style** — All illustrations use a hardcoded "dark fantasy digital painting" style suffix
- **Smart Context** — Only the last 5 messages plus a rolling summary are sent to the LLM, keeping responses fast and coherent

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Setup

```bash
# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key |

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts    # Gemini text generation (persona + game turns)
│   │   └── image/route.ts   # Gemini image generation
│   ├── globals.css           # Tailwind + custom CSS variables
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page with phase management
├── components/
│   ├── UniverseSetup.tsx     # Universe selection screen
│   ├── PersonaSetup.tsx      # Character generation and editing
│   ├── GameScreen.tsx        # Main split-screen game controller
│   ├── ChatPanel.tsx         # Scrolling chat interface
│   ├── IllustrationPanel.tsx # Scene illustration display
│   ├── StatusBar.tsx         # HP, stats, location bar
│   └── InventoryDrawer.tsx   # Slide-out inventory panel
├── lib/
│   ├── gemini.ts             # Gemini client singleton
│   └── prompts.ts            # System prompt builders
└── types/
    └── game.ts               # TypeScript interfaces
```

### Game Flow

1. **Universe Selection** — Free-text input with quick suggestions
2. **Persona Generation** — AI creates a character; user can modify or reroll
3. **Portrait Generation** — AI generates a character portrait on confirmation
4. **Gameplay** — Split-screen with rolling chat and dynamic illustrations

### LLM Response Format

Every game turn returns structured JSON:

```json
{
  "narrative": "Story text describing what happens...",
  "state_updates": {
    "hp": 95,
    "inventory": ["rusty sword", "health potion"],
    "location": "Dark Forest",
    "gold": 15,
    "stats": { "Strength": 14 }
  },
  "image_prompt": "A dark forest with twisted trees and glowing mushrooms"
}
```

Images only generate when `image_prompt` is non-null (location changes, major events).

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Google Gemini API** (`@google/genai`)
