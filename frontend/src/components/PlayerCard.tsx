import { Link } from "react-router-dom";
import type { CandidateRecord, PlayerState } from "../types";
import { Sparkline } from "./Sparkline";
import { StatusPill } from "./StatusPill";

interface Props {
  state: PlayerState;
  candidates: CandidateRecord[];
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem.toString().padStart(2, "0")}s` : `${s}s`;
}

export function PlayerCard({ state, candidates }: Props) {
  const best = candidates.reduce<null | number>(
    (acc, c) => (acc === null || c.score > acc ? c.score : acc),
    null
  );
  const pct = state.step_total > 0 ? (state.step / state.step_total) * 100 : 0;

  return (
    <Link
      to={`/p/${encodeURIComponent(state.name)}`}
      className="panel"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 0,
        textDecoration: "none",
        color: "inherit",
        minHeight: 180,
        overflow: "hidden",
        transition: "border-color var(--motion-fast) var(--ease-standard)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = state.color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--bg-line)";
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--bg-line)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ width: 3, height: 24, background: state.color, borderRadius: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {state.name}
          </div>
        </div>
        <StatusPill state={state} />
      </div>

      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          className="t-body"
          style={{
            color: "var(--text-muted)",
            fontSize: 12,
            minHeight: 34,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {state.current_action || "idle"}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span className="t-label">best score</span>
          <span className="t-display" style={{ fontSize: 24, color: "var(--text-primary)" }}>
            {best !== null ? best.toFixed(2) : "—"}
          </span>
        </div>

        <Sparkline values={state.score_history} color={state.color} height={32} width={240} />
      </div>

      <div
        style={{
          padding: "8px 14px",
          borderTop: "1px solid var(--bg-line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          color: "var(--text-dim)",
        }}
      >
        <span className="t-meta">
          STEP {state.step} / {state.step_total || "?"}
        </span>
        <div
          style={{
            flex: 1,
            margin: "0 10px",
            height: 2,
            background: "var(--bg-line)",
            borderRadius: 1,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: state.color,
              transition: "width var(--motion-slow) var(--ease-standard)",
            }}
          />
        </div>
        <span className="t-meta">{formatElapsed(state.elapsed_ms)}</span>
      </div>
    </Link>
  );
}
