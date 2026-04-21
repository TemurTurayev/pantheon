export interface ToolCallRecord {
  tool: string;
  player: string;
  turn: number;
  output: Record<string, unknown>;
  t_ms: number;
}

export interface CandidateRecord {
  id: string;
  player: string;
  sequence: string;
  delta_g: number;
  iptm: number;
  score: number;
}

export interface RoundLog {
  round_id: string;
  target_id: string;
  target_pdb: string;
  players: { name: string; color: string }[];
  tool_calls: ToolCallRecord[];
  candidates: CandidateRecord[];
  events: { t_ms: number; text: string; severity?: "info" | "milestone" }[];
}
