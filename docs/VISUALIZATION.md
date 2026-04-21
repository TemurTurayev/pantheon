# Visualization

The experience should feel like a JARVIS workbench: 3D molecular structures front and centre, auxiliary panels for live reasoning, tool timeline, and affinity.

## Goals

1. **Watchable** — good for Twitch / YouTube live streams.
2. **Navigable** — viewer can scrub a replay and jump to any tool call.
3. **Trustworthy** — structures shown are verifiable (DOIs in the overlay).
4. **Fast** — all rendering in-browser, no heavy client install.

## Tech

- **Mol\*** (molstar.org) — WebGL-based biomolecular viewer, embeddable in React. Primary component for any `.pdb` / `.cif` content.
- **Three.js** — any custom HUD element that is not a molecular structure (progress bars, particle effects on a milestone).
- **React + Vite** — host app. Keep it framework-light so it stays hackable.
- **Recharts** or **visx** — score and ELO timeline charts.
- **Tailwind** + a restrained palette — "engineering workbench", not "neon gaming rig".
- **OBS Studio** — capture for streaming. The app should render at a fixed 1920×1080 with no browser chrome.

## Layout (replay / live view)

```
┌────────────────────────────────────┬──────────────────────┐
│                                    │  PLAYER PANEL        │
│                                    │  name, model, logo   │
│   STRUCTURE PANEL                  │  ELO • turn • budget │
│   Mol* viewer                      │──────────────────────│
│   - target (grey ribbon)           │  LIVE REASONING      │
│   - candidate (coloured ribbon)    │  (tails scratchpad)  │
│   - binding pocket (hotspot)       │                      │
│                                    │                      │
├────────────────────────────────────┼──────────────────────┤
│   AFFINITY TIMELINE                │  TOOL TIMELINE       │
│   line per candidate, ΔG y-axis    │  rfdiff → mpnn →     │
│                                    │  boltz2 → md → …     │
├────────────────────────────────────┴──────────────────────┤
│   EVENT TICKER — "Claude hit ΔG = -11.2 kcal/mol!"        │
└───────────────────────────────────────────────────────────┘
```

## Visual language

- Each participating model has a fixed accent colour. Stable across seasons.
- Structure ribbons are coloured by the contributing model.
- A candidate that was retried (model iterated on it) is connected to its parent by a faint line in the timeline.
- Milestone events (new best ΔG, first successful MD run, wet-lab dispatch) fire a brief Three.js particle burst over the event ticker, no audio by default.

## Streaming mode

An additional "broadcast" layout stacks:

- Top third — global leaderboard with season ELO and round number.
- Middle — the main structure panel.
- Bottom — scrolling commentator captions (TTS-generated from a commentator LLM, see Phase 6 in `ROADMAP.md`).

## Replay

Every round's telemetry log (JSONL) is self-sufficient:

- Tool calls with inputs and output hashes
- Scratchpad snapshots
- Wall-clock timestamps

The UI parses the log and plays it back at real time or accelerated (up to 50×). Any tool call is clickable — clicking opens a modal with the exact inputs, the raw output, and a link to the cached payload.

## Asset pipeline

- `.pdb` / `.cif` are streamed into Mol\* from the cache directly (content-addressed).
- Reasoning traces arrive via WebSocket (live) or fetch (replay).
- Model logos and colours live in `frontend/assets/models.json` — adding a new participant means one file edit.

## Accessibility

- All colour-coded information (model colour, severity of a flag) has a redundant text label.
- Motion can be disabled via a global toggle.
- Keyboard navigation for the replay slider and tool-call modals.

## Out of scope (for now)

- VR / AR viewing modes.
- Mobile-optimized layout (everything assumes a 1920×1080+ viewport).
- Per-atom editing in the browser (the arena is read-only; edits happen in the tool-call loop, not the viewer).
