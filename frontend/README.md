# Pantheon Frontend

JARVIS-style viewer: 3D target structure (Mol\*), player panel, affinity chart, tool timeline, event ticker.

## Setup

```bash
cd frontend
npm install
npm run dev
```

By default the app reads `/public/round.json` — a static example is committed so the UI renders immediately. Point `fetch("/round.json")` in `src/App.tsx` at a live SSE endpoint to get streaming updates (Phase 6).

## Layout

```
┌────────────────────────────────┬──────────────────┐
│                                │ PLAYER PANEL     │
│   STRUCTURE PANEL              │                  │
│   (Mol* — target & candidates) ├──────────────────┤
│                                │                  │
├────────────────────────────────┤ TOOL TIMELINE    │
│  AFFINITY CHART                │                  │
│                                │                  │
├────────────────────────────────┴──────────────────┤
│  EVENT TICKER                                     │
└───────────────────────────────────────────────────┘
```

## Files

- `src/main.tsx` — React root
- `src/App.tsx` — layout container
- `src/types.ts` — `RoundLog` shape shared with the Python backend
- `src/components/*.tsx` — one panel per file
- `public/round.json` — static demo round for offline preview

Everything is intentionally framework-light so it stays hackable for streaming overlays.
