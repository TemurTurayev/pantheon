import { Suspense, lazy, useState } from "react";
import { CommentatorPanel } from "../components/CommentatorPanel";
import { Sparkline } from "../components/Sparkline";
import { StatusPill } from "../components/StatusPill";
import { useRound } from "../data/useRound";
import type { PlayerState } from "../types";

const MolstarViewer = lazy(() =>
  import("../components/MolstarViewer").then((m) => ({ default: m.MolstarViewer }))
);

// 1920×1080 broadcast layout. Designed to be the only thing on screen when
// OBS captures the browser at fullscreen — no navigation chrome, no title bars.

const STAGE: React.CSSProperties = {
  width: 1920,
  height: 1080,
  background: "var(--bg-void)",
  color: "var(--text-primary)",
  display: "grid",
  gridTemplateRows: "72px 612px 96px 120px 180px",
  overflow: "hidden",
  position: "relative",
};

export function BroadcastPage() {
  const round = useRound();
  const [focusedPlayer, setFocusedPlayer] = useState<string | null>(null);

  if (!round) {
    return (
      <div style={{ width: 1920, height: 1080, background: "var(--bg-void)", color: "var(--text-muted)", padding: 48 }}>
        Loading PANTHEON broadcast…
      </div>
    );
  }

  const focused = round.players.find((p) => p.name === focusedPlayer) ?? round.players[0];
  const reasoning = round.reasoning_by_player[focused.name] ?? [];
  const latestReasoning = reasoning[reasoning.length - 1];

  return (
    <div style={STAGE} role="main" aria-label="PANTHEON broadcast stage">
      {/* 1. SCORES STRIP (1920×72) */}
      <ScoresStrip round={round} onSelect={setFocusedPlayer} focused={focused.name} />

      {/* 2. MAIN BODY — POV | VIEWER | COMMENTARY (1920×612) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "384px 1152px 384px",
          borderBottom: "1px solid var(--bg-line)",
        }}
      >
        <PovPanel state={focused} reasoning={reasoning} />
        <div style={{ position: "relative", background: "var(--bg-panel)" }}>
          <Suspense fallback={<div style={{ padding: 24, color: "var(--text-muted)" }}>loading viewer…</div>}>
            <MolstarViewer
              pdbId={round.target_pdb}
              representation="cartoon"
              colorTheme="chain-id"
              hotspots={round.hotspots}
              binderColor={focused.color}
              accessibleDescription={`Broadcast 3D view: target ${round.target_pdb}, focused player ${focused.name}`}
            />
          </Suspense>
        </div>
        <CommentatorPanel round={round} />
      </div>

      {/* 3. REASONING SUBTITLE (1920×96) */}
      <div
        style={{
          padding: "16px 48px",
          background: "var(--bg-panel)",
          borderBottom: "1px solid var(--bg-line)",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div style={{ width: 4, height: 48, background: focused.color, borderRadius: 2 }} />
        <div style={{ flex: 1 }}>
          <div className="t-label" style={{ color: focused.color, marginBottom: 4 }}>
            {focused.name} · reasoning
          </div>
          <div style={{ fontSize: 20, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {latestReasoning?.summary ?? focused.current_action}
          </div>
        </div>
      </div>

      {/* 4. EVENT TICKER + T-MINUS (1920×120) */}
      <EventTicker events={round.events} />

      {/* 5. SAFE ZONE (1920×180) — leave dimmed for Twitch/YouTube overlay */}
      <div
        style={{
          background: "linear-gradient(to bottom, var(--bg-void), #000)",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="t-meta" style={{ fontSize: 12 }}>SAFE ZONE · chat overlay rendered here by OBS</div>
        <div className="t-meta" style={{ fontSize: 12 }}>pantheon.live · S0 streptavidin · calibration</div>
      </div>
    </div>
  );
}

function ScoresStrip({
  round,
  onSelect,
  focused,
}: {
  round: ReturnType<typeof useRound> & object;
  onSelect: (n: string) => void;
  focused: string;
}) {
  const best: Record<string, number> = {};
  for (const c of round.candidates) {
    if (!(c.player in best) || c.score > best[c.player]) best[c.player] = c.score;
  }
  const leader = round.players.reduce((top, p) => ((best[p.name] ?? 0) > (best[top.name] ?? 0) ? p : top), round.players[0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        gap: 24,
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--bg-line)",
      }}
    >
      <span className="t-display" style={{ fontSize: 20, letterSpacing: "0.2em", color: "var(--accent-cyan)" }}>
        PANTHEON
      </span>
      <span className="t-label" style={{ marginLeft: 8 }}>{round.round_id} · target {round.target_pdb}</span>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 32 }}>
        {round.players.map((p) => {
          const score = (best[p.name] ?? 0).toFixed(2);
          return (
            <button
              key={p.name}
              onClick={() => onSelect(p.name)}
              style={{
                background: focused === p.name ? "var(--bg-panel)" : "transparent",
                border: "1px solid",
                borderColor: focused === p.name ? p.color : "transparent",
                borderRadius: 6,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 3, height: 20, background: p.color, borderRadius: 2 }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
              <span className="t-display" style={{ fontSize: 18, color: "var(--text-primary)" }}>{score}</span>
              {p.name === leader.name && (
                <span style={{ fontSize: 10, color: "var(--accent-amber)", letterSpacing: 0.4 }}>● LEADER</span>
              )}
            </button>
          );
        })}
      </div>
      <span className="t-label" style={{ color: "var(--good)" }}>● LIVE</span>
    </div>
  );
}

function PovPanel({ state, reasoning }: { state: PlayerState; reasoning: any[] }) {
  const recent = reasoning.slice(-4).reverse();
  return (
    <div
      style={{
        background: "var(--bg-raised)",
        borderRight: "1px solid var(--bg-line)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 4, height: 24, background: state.color, borderRadius: 2 }} />
        <span style={{ fontSize: 16, fontWeight: 600 }}>{state.name}</span>
      </div>
      <StatusPill state={state} />

      <div>
        <div className="t-label" style={{ marginBottom: 4 }}>CURRENT ACTION</div>
        <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{state.current_action}</div>
      </div>

      <div>
        <div className="t-label" style={{ marginBottom: 4 }}>SCORE TREND</div>
        <Sparkline values={state.score_history} color={state.color} height={40} width={344} />
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div className="t-label" style={{ marginBottom: 6 }}>LAST REASONING</div>
        {recent.map((r, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              color: i === 0 ? "var(--text-primary)" : "var(--text-muted)",
              marginBottom: 6,
              paddingLeft: 8,
              borderLeft: `2px solid ${state.color}`,
            }}
          >
            {r.summary}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventTicker({ events }: { events: { text: string; severity?: string }[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--bg-line)",
        padding: "0 32px",
        gap: 32,
        overflow: "hidden",
      }}
    >
      <span className="t-label" style={{ color: "var(--accent-amber)" }}>EVENTS ›</span>
      <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap" }}>
        {events.map((e, i) => (
          <span
            key={i}
            style={{
              fontSize: 14,
              color: e.severity === "milestone" ? "var(--accent-amber)" : "var(--text-primary)",
            }}
          >
            {e.text}
          </span>
        ))}
      </div>
    </div>
  );
}
