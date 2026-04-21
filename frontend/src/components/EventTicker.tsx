import type { RoundLog } from "../types";

interface Props {
  round: RoundLog | null;
}

const PANEL: React.CSSProperties = {
  gridColumn: "1 / 3",
  gridRow: "4 / 5",
  background: "#0f151c",
  border: "1px solid #1e2a36",
  borderRadius: 8,
  padding: "0 16px",
  display: "flex",
  alignItems: "center",
  gap: 24,
  overflow: "hidden",
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  fontSize: 13,
};

export function EventTicker({ round }: Props) {
  const events = round?.events ?? [];
  return (
    <div style={PANEL}>
      <span style={{ color: "#6a7a8a", letterSpacing: 1.2 }}>EVENTS ›</span>
      {events.length === 0 && <span style={{ color: "#6a7a8a" }}>—</span>}
      {events.map((e, i) => (
        <span
          key={i}
          style={{
            color: e.severity === "milestone" ? "#ffd13b" : "#d6dce5",
            whiteSpace: "nowrap",
          }}
        >
          [{e.t_ms}ms] {e.text}
        </span>
      ))}
    </div>
  );
}
