# Agents

## Cursor Cloud specific instructions

This is a single-service **Next.js 15** app (App Router, Turbopack, React 19, Tailwind CSS 4).

### Running the app

Standard commands are in `package.json`:

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 3000, uses Turbopack) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Environment variables

The app requires a `GEMINI_API_KEY` environment variable (Google Gemini API). Copy `.env.example` to `.env.local` and set a valid key. The key in `.env.example` is revoked and will return a 403 PERMISSION_DENIED error.

If `GEMINI_API_KEY` is provided as a VM secret (environment variable), write it into `.env.local` before starting the dev server:

```bash
echo "GEMINI_API_KEY=$GEMINI_API_KEY" > .env.local
```

### Caveats

- There are no automated tests in this project (no test script in `package.json`).
- All state is client-side (no database). The only external dependency is the Google Gemini API.
- `next lint` is deprecated in Next.js 16+; the codebase still uses it via `npm run lint`.
