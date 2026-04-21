import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BroadcastFooter } from "../components/BroadcastFooter";
import { CandidateList } from "../components/CandidateList";
import { MolstarViewer, type ColorTheme, type Representation } from "../components/MolstarViewer";
import { ReasoningTimeline } from "../components/ReasoningTimeline";
import { ResidueInfoCard } from "../components/ResidueInfoCard";
import { ScaleDolly, type DollyStop } from "../components/ScaleDolly";
import { StressTestPanel } from "../components/StressTestPanel";
import { TopBar } from "../components/TopBar";
import { ViewerControls } from "../components/ViewerControls";
import { useRound } from "../data/useRound";

const PAGE: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  height: "100vh",
  width: "100vw",
  background: "var(--bg-void)",
};

const BODY: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px 1fr 340px",
  gap: 12,
  padding: 12,
  overflow: "hidden",
};

export function PlayerDetailPage() {
  const round = useRound();
  const { player } = useParams<{ player: string }>();

  const [representation, setRepresentation] = useState<Representation>("cartoon");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("chain-id");
  const [selectedResidue, setSelectedResidue] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [scaleDollyOpen, setScaleDollyOpen] = useState(false);
  const [dollyStop, setDollyStop] = useState<DollyStop | null>(null);

  // When the dolly moves through a stop that implies a representation change,
  // reflect it in the viewer so the cinematic narration matches what you see.
  const effectiveRepresentation: Representation =
    dollyStop && dollyStop.representationHint !== "context"
      ? dollyStop.representationHint
      : representation;

  const state = useMemo(() => round?.players.find((p) => p.name === player), [round, player]);
  const candidates = useMemo(
    () => (round ? round.candidates.filter((c) => c.player === player) : []),
    [round, player]
  );
  const reasoning = useMemo(
    () => (round?.reasoning_by_player[player ?? ""] ?? []),
    [round, player]
  );
  const activeCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidate) ?? candidates[0] ?? null,
    [candidates, selectedCandidate]
  );

  if (!round || !state) {
    return (
      <div style={PAGE}>
        <div style={{ padding: 24, color: "var(--text-muted)" }}>
          {round ? `unknown player: ${player}` : "loading round…"}
        </div>
      </div>
    );
  }

  return (
    <div style={PAGE}>
      <TopBar round={round} breadcrumb={`player · ${state.name}`} />

      <div style={BODY}>
        {/* LEFT — reasoning */}
        <section aria-label={`${state.name} reasoning`} className="panel" style={{ overflow: "hidden" }}>
          <ReasoningTimeline entries={reasoning} color={state.color} />
        </section>

        {/* CENTER — viewer + controls + stress */}
        <section aria-label="Molecular viewer and stress test" style={{ display: "grid", gridTemplateRows: "auto 1fr 300px", gap: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <ViewerControls
              representation={representation}
              colorTheme={colorTheme}
              onRepresentation={setRepresentation}
              onColorTheme={setColorTheme}
            />
            <button
              className="btn"
              onClick={() => setScaleDollyOpen((o) => !o)}
              aria-pressed={scaleDollyOpen}
              aria-label="Toggle scale dolly — cinematic zoom from cell to atom"
              style={{ whiteSpace: "nowrap" }}
            >
              {scaleDollyOpen ? "Close dolly" : "Scale dolly · cell → atom"}
            </button>
          </div>
          <div className="panel" style={{ position: "relative", overflow: "hidden", minHeight: 260 }}>
            <MolstarViewer
              pdbId={round.target_pdb}
              representation={effectiveRepresentation}
              colorTheme={colorTheme}
              hotspots={round.hotspots}
              binderColor={state.color}
              focusPocket
              accessibleDescription={`3D view of ${round.target_id} (PDB ${round.target_pdb}) with ${round.hotspots.length} hotspots highlighted. Active player: ${state.name}.`}
              onResidueClick={setSelectedResidue}
            />
            <ResidueInfoCard
              residue={selectedResidue}
              hotspots={round.hotspots}
              onClear={() => setSelectedResidue(null)}
            />
            {scaleDollyOpen && <ScaleDolly onStopChange={setDollyStop} />}
          </div>
          <StressTestPanel stress={activeCandidate?.stress_test ?? null} color={state.color} />
        </section>

        {/* RIGHT — candidates + rationale */}
        <aside aria-label="Candidates and rationale" style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 12, overflow: "hidden" }}>
          <CandidateList
            candidates={candidates}
            selectedId={activeCandidate?.id ?? null}
            onSelect={setSelectedCandidate}
            color={state.color}
          />
          {activeCandidate && (
            <div className="panel" style={{ padding: 14 }}>
              <div className="t-label" style={{ marginBottom: 6 }}>RATIONALE</div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.55, marginBottom: 8 }}>
                {activeCandidate.rationale || "(no rationale recorded)"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <MiniStat label="ΔG" value={activeCandidate.delta_g.toFixed(1)} unit="kcal/mol" />
                <MiniStat label="ipTM" value={activeCandidate.iptm.toFixed(2)} unit="" />
                <MiniStat label="score" value={activeCandidate.score.toFixed(2)} unit="" />
              </div>
            </div>
          )}
        </aside>
      </div>

      <BroadcastFooter players={round.players} candidates={round.candidates} />
    </div>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="panel-raised" style={{ padding: 8 }}>
      <div className="t-label" style={{ fontSize: 9 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span className="t-mono" style={{ fontSize: 15, color: "var(--text-primary)" }}>{value}</span>
        {unit && <span className="t-meta">{unit}</span>}
      </div>
    </div>
  );
}
