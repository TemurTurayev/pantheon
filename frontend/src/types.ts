// Contract shared with the Python exporter (src/pantheon/viz/exporter.py).
// Any breaking change here must be mirrored there.

export type PlayerStatus = "thinking" | "tool" | "done" | "error";

export interface PlayerState {
  name: string;
  color: string;
  status: PlayerStatus;
  current_action: string;          // short, 1 line
  current_tool?: string;           // set when status === "tool"
  step: number;
  step_total: number;
  elapsed_ms: number;
  score_history: number[];         // for sparkline
}

export interface ReasoningEntry {
  t_ms: number;
  kind: "thought" | "tool_call" | "tool_result" | "event";
  summary: string;
  body?: string;                   // collapsible detail
  tool?: string;
}

export interface ToolCallRecord {
  tool: string;
  player: string;
  turn: number;
  output: Record<string, unknown>;
  t_ms: number;
  status?: "ok" | "error";
}

export interface StressFrame {
  t_ns: number;
  rmsd: number;
  rg: number;           // radius of gyration
  q_native: number;     // fraction of native contacts, 0..1
  h_bonds: number;
}

export interface StressTest {
  condition: string;    // e.g. "T=400K, 5ns MD"
  verdict: "pass" | "fail" | "pending";
  frames: StressFrame[];
  events: { t_ns: number; text: string; severity: "info" | "good" | "warn" }[];
  rmsf_per_residue: number[];
  pdb_snapshot_url?: string;   // multi-model PDB for the trajectory animation
}

export interface CandidateRecord {
  id: string;
  player: string;
  sequence: string;
  delta_g: number;
  iptm: number;
  score: number;
  rationale: string;
  hotspot_residues: number[];
  stress_test?: StressTest;
}

export interface HotspotAnnotation {
  residue: number;
  label: string;
  role: "pocket" | "hotspot" | "binding" | "catalytic";
  explainer: string;   // plain-language for non-experts
}

export interface StressGoal {
  id: string;
  description: string;
  perturbationId: string;          // matches PerturbationPreset.id
  durationS: number;
  temperature?: number;
  intensity?: number;
  passCriterion: string;           // human-readable
  passThreshold: number;           // 0..1, fraction-of-stability needed to pass
}

export interface RoundLog {
  round_id: string;
  target_id: string;
  target_pdb: string;
  target_stakes: string;    // one-sentence layperson framing
  players: PlayerState[];
  reasoning_by_player: Record<string, ReasoningEntry[]>;
  tool_calls: ToolCallRecord[];
  candidates: CandidateRecord[];
  hotspots: HotspotAnnotation[];
  stress_goal?: StressGoal | null;
  events: { t_ms: number; text: string; severity?: "info" | "milestone" }[];
}
