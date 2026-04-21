import type { CandidateRecord, PlayerState } from "../types";

interface Props {
  players: PlayerState[];
  candidates: CandidateRecord[];
}

// Persistent bottom bar showing live scores — esports-broadcast style.

export function BroadcastFooter({ players, candidates }: Props) {
  const best: Record<string, number> = {};
  for (const c of candidates) {
    if (!(c.player in best) || c.score > best[c.player]) best[c.player] = c.score;
  }
  const maxScore = Math.max(...Object.values(best), 1);

  return (
    <div
      style={{
        height: 56,
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--bg-line)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 24,
      }}
    >
      <span className="t-label" style={{ whiteSpace: "nowrap" }}>
        LIVE · SCORES
      </span>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${players.length}, 1fr)`, gap: 24 }}>
        {players.map((p) => {
          const s = best[p.name] ?? 0;
          const pct = (s / maxScore) * 100;
          return (
            <div key={p.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </span>
                <span className="t-mono" style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  {s.toFixed(2)}
                </span>
              </div>
              <div style={{ height: 3, background: "var(--bg-line)", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: p.color,
                    transition: "width var(--motion-slow) var(--ease-standard)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
