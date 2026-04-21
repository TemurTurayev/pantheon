import type { RoundLog } from "../types";

interface Props {
  round: RoundLog | null;
}

const PANEL: React.CSSProperties = {
  gridColumn: "2 / 3",
  gridRow: "1 / 2",
  background: "#111820",
  border: "1px solid #1e2a36",
  borderRadius: 8,
  padding: 16,
  overflow: "auto",
};

export function PlayerPanel({ round }: Props) {
  if (!round)
    return (
      <div style={PANEL}>
        <div style={{ color: "#6a7a8a", fontSize: 12, letterSpacing: 1.2 }}>PLAYERS · idle</div>
      </div>
    );

  return (
    <div style={PANEL}>
      <div style={{ color: "#6a7a8a", fontSize: 12, letterSpacing: 1.2, marginBottom: 12 }}>
        PLAYERS · round {round.round_id}
      </div>
      {round.players.map((p) => {
        const best = round.candidates
          .filter((c) => c.player === p.name)
          .reduce<null | number>((acc, c) => (acc === null || c.score > acc ? c.score : acc), null);
        return (
          <div
            key={p.name}
            style={{
              marginBottom: 10,
              padding: "8px 10px",
              borderLeft: `3px solid ${p.color}`,
              background: "#0f151c",
            }}
          >
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "#8ea0b3" }}>
              best score: {best !== null ? best.toFixed(3) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
