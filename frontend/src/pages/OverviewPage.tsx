import { useRound } from "../data/useRound";
import { BroadcastFooter } from "../components/BroadcastFooter";
import { PlayerCard } from "../components/PlayerCard";
import { TopBar } from "../components/TopBar";

const PAGE: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  height: "100vh",
  width: "100vw",
  background: "var(--bg-void)",
};

export function OverviewPage() {
  const round = useRound();

  if (!round) {
    return (
      <div style={PAGE}>
        <div style={{ padding: 24, color: "var(--text-muted)" }}>loading round…</div>
      </div>
    );
  }

  return (
    <div style={PAGE}>
      <TopBar round={round} />

      <div style={{ overflow: "auto", padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div className="t-label" style={{ marginBottom: 6 }}>MISSION</div>
          <div style={{ fontSize: 18, color: "var(--text-primary)", maxWidth: 900 }}>
            {round.target_stakes || `Design a binder against ${round.target_id}`}
          </div>
        </div>

        <div className="t-label" style={{ marginBottom: 8 }}>
          PARTICIPANTS · {round.players.length}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
            gap: 16,
          }}
        >
          {round.players.map((p) => (
            <PlayerCard
              key={p.name}
              state={p}
              candidates={round.candidates.filter((c) => c.player === p.name)}
            />
          ))}
        </div>

        <div style={{ marginTop: 32 }} className="t-label">LEGEND</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, color: "var(--text-muted)", fontSize: 12 }}>
          <span>● <span style={{ color: "var(--status-thinking)" }}>thinking</span> — reasoning</span>
          <span>● <span style={{ color: "var(--status-tool)" }}>tool:name</span> — calling a tool</span>
          <span>● <span style={{ color: "var(--good)" }}>done</span> — submitted</span>
          <span>● <span style={{ color: "var(--warn)" }}>error</span> — failed, will retry</span>
          <span style={{ marginLeft: "auto", color: "var(--text-dim)" }}>click a card for detail view</span>
        </div>
      </div>

      <BroadcastFooter players={round.players} candidates={round.candidates} />
    </div>
  );
}
