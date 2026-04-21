import { Link } from "react-router-dom";
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
        <div role="status" aria-live="polite" style={{ padding: 24, color: "var(--text-muted)" }}>
          loading round…
        </div>
      </div>
    );
  }

  return (
    <div style={PAGE}>
      <TopBar round={round} />

      <main aria-label="Arena overview" style={{ overflow: "auto", padding: 24 }}>
        <section aria-labelledby="mission-heading" style={{ marginBottom: 16 }}>
          <h2 id="mission-heading" className="t-label" style={{ margin: "0 0 6px 0" }}>MISSION</h2>
          <p style={{ fontSize: 18, color: "var(--text-primary)", maxWidth: 900, margin: 0 }}>
            {round.target_stakes || `Design a binder against ${round.target_id}`}
          </p>
        </section>

        <section aria-labelledby="participants-heading">
          <h2 id="participants-heading" className="t-label" style={{ margin: "0 0 8px 0" }}>
            PARTICIPANTS · {round.players.length}
          </h2>
          <div
            role="list"
            aria-label="Player cards"
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
        </section>

        <section aria-labelledby="legend-heading" style={{ marginTop: 32 }}>
          <h2 id="legend-heading" className="t-label" style={{ margin: 0 }}>LEGEND</h2>
          <ul
            aria-label="Status colors"
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginTop: 8,
              color: "var(--text-muted)",
              fontSize: 12,
              listStyle: "none",
              padding: 0,
            }}
          >
            <li>● <span style={{ color: "var(--status-thinking)" }}>thinking</span> — reasoning</li>
            <li>● <span style={{ color: "var(--status-tool)" }}>tool:name</span> — calling a tool</li>
            <li>● <span style={{ color: "var(--good)" }}>done</span> — submitted</li>
            <li>● <span style={{ color: "var(--warn)" }}>error</span> — failed, will retry</li>
            <li style={{ marginLeft: "auto", color: "var(--text-dim)" }}>click a card for detail view</li>
          </ul>
        </section>

        <section style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/broadcast" className="btn">
            Open broadcast view →
          </Link>
          <Link to={`/viewer/${round.target_pdb}`} className="btn btn-primary">
            ⛶  Fullscreen viewer + tools
          </Link>
          <span className="t-meta">
            broadcast: 1920×1080 OBS layout · fullscreen: interactive Mol* + perturbations
          </span>
        </section>
      </main>

      <BroadcastFooter players={round.players} candidates={round.candidates} />
    </div>
  );
}
