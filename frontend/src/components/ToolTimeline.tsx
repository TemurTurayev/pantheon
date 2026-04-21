import type { RoundLog } from "../types";

interface Props {
  round: RoundLog | null;
}

const PANEL: React.CSSProperties = {
  gridColumn: "2 / 3",
  gridRow: "2 / 4",
  background: "#111820",
  border: "1px solid #1e2a36",
  borderRadius: 8,
  padding: 12,
  overflow: "auto",
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  fontSize: 12,
};

const TOOL_COLOR: Record<string, string> = {
  pubmed_search: "#5ea8ff",
  rfdiffusion: "#8c5eff",
  proteinmpnn: "#ff6ec7",
  boltz2: "#ffd13b",
  chai1: "#64e1a8",
  openmm_md: "#ff8a5e",
  rdkit_analyze: "#88dce0",
  biosecurity_screen: "#ff4d6d",
};

export function ToolTimeline({ round }: Props) {
  return (
    <div style={PANEL}>
      <div style={{ color: "#6a7a8a", fontSize: 12, letterSpacing: 1.2, marginBottom: 8 }}>
        TOOL TIMELINE
      </div>
      {(round?.tool_calls ?? []).map((tc, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <span style={{ color: "#6a7a8a", minWidth: 48 }}>{tc.t_ms}ms</span>
          <span style={{ color: "#8ea0b3", minWidth: 80 }}>{tc.player}</span>
          <span
            style={{
              color: TOOL_COLOR[tc.tool] ?? "#d6dce5",
              fontWeight: 600,
            }}
          >
            {tc.tool}
          </span>
        </div>
      ))}
      {!round && <div style={{ color: "#6a7a8a" }}>waiting…</div>}
    </div>
  );
}
