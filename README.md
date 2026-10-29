# Evently

Evently is a mobile-first event planning assistant for weddings, birthdays, and community events. It creates a budget, countdown, vendor shortlist, and personalized ideas in one place. When Gemini is not configured or unavailable, the app stays usable with a friendly starter plan.

## Setup

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_GEMINI_API_KEY` in `.env.local` to enable personalized Gemini planning and chat. Never commit a key. A client-side key is visible to users; production deployments should route Gemini requests through a server-side proxy and enforce server-side quotas.

## Architecture

- `src/components/` contains the onboarding flow and lazy-loaded chat.
- `src/services/gemini.ts` handles structured plan generation, schema validation, retries, and fallback.
- `src/lib/planner.ts` contains deterministic allocation, validation, sanitation, and fallback helpers.
- `src/types.ts` defines the event and Zod plan schemas.
- `src/App.tsx` owns plan state and derives budget/progress values from the plan.

Plans and progress are stored under the versioned `evently.plan.v1` localStorage key. “Clear my data” removes it. No account or server storage is used.

## Scripts

- `npm run dev` — start the local development server.
- `npm run build` — type-check and build production files.
- `npm test` — run the Vitest suite.

## Accessibility

Semantic landmarks, a skip link, keyboard-operable tabs, visible focus states, form labels, status announcements, chart labels, reduced-motion handling, and responsive layouts are included. The theme switch offers a dark palette.

## Security

AI output is parsed as JSON and validated with Zod before use; user text is length-limited and stripped of control characters. Rendered text stays plain text. The app uses a restrictive Content Security Policy and stores only the event plan in localStorage. Do not put sensitive personal data in event notes.