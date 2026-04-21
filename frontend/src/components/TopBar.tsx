import { Link } from "react-router-dom";
import type { RoundLog } from "../types";

interface Props {
  round: RoundLog;
  breadcrumb?: string;
}

export function TopBar({ round, breadcrumb }: Props) {
  return (
    <div
      style={{
        height: 56,
        background: "var(--bg-panel)",
        borderBottom: "1px solid var(--bg-line)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="none" />
          <circle cx="11" cy="11" r="3" fill="var(--accent-cyan)" />
        </svg>
        <span className="t-display" style={{ fontSize: 14, letterSpacing: "0.15em", color: "var(--text-primary)" }}>
          PANTHEON
        </span>
      </Link>
      <div style={{ height: 20, width: 1, background: "var(--bg-line)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span className="t-label">ROUND · {round.round_id}</span>
        <span style={{ fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          target · <strong>{round.target_id}</strong> · PDB {round.target_pdb}
          {breadcrumb ? ` · ${breadcrumb}` : ""}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span className="t-label" style={{ color: "var(--good)" }}>● LIVE</span>
      </div>
    </div>
  );
}
