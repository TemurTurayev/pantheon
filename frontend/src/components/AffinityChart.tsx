import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { RoundLog } from "../types";

interface Props {
  round: RoundLog | null;
}

const PANEL: React.CSSProperties = {
  gridColumn: "1 / 2",
  gridRow: "3 / 4",
  background: "#111820",
  border: "1px solid #1e2a36",
  borderRadius: 8,
  padding: 8,
};

// Placeholder: until Phase 4 scoring is wired into the round log, we chart
// the delta_g of each candidate in submission order per player.

export function AffinityChart({ round }: Props) {
  if (!round) return <div style={PANEL} />;

  const byPlayer: Record<string, { idx: number; delta_g: number }[]> = {};
  round.candidates.forEach((c, i) => {
    byPlayer[c.player] = byPlayer[c.player] ?? [];
    byPlayer[c.player].push({ idx: i, delta_g: c.delta_g });
  });

  const maxLen = Math.max(0, ...Object.values(byPlayer).map((v) => v.length));
  const merged = Array.from({ length: maxLen }, (_, i) => {
    const row: Record<string, number | string> = { idx: i };
    for (const [player, pts] of Object.entries(byPlayer)) {
      if (pts[i]) row[player] = pts[i].delta_g;
    }
    return row;
  });

  return (
    <div style={PANEL}>
      <div style={{ color: "#6a7a8a", fontSize: 12, letterSpacing: 1.2, padding: "4px 8px" }}>
        AFFINITY · ΔG (kcal/mol)
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={merged}>
          <CartesianGrid stroke="#1e2a36" />
          <XAxis dataKey="idx" stroke="#6a7a8a" />
          <YAxis reversed stroke="#6a7a8a" />
          <Tooltip contentStyle={{ background: "#0f151c", border: "1px solid #1e2a36" }} />
          {round.players.map((p) => (
            <Line key={p.name} type="monotone" dataKey={p.name} stroke={p.color} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
