import type { CandidateRecord } from "../types";

interface Props {
  candidates: CandidateRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  color: string;
}

export function CandidateList({ candidates, selectedId, onSelect, color }: Props) {
  const ranked = [...candidates].sort((a, b) => b.score - a.score);

  return (
    <div className="panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="t-label" style={{ padding: "10px 12px", borderBottom: "1px solid var(--bg-line)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 12, background: color, borderRadius: 2 }} />
        CANDIDATES · {ranked.length}
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {ranked.length === 0 && (
          <div style={{ padding: 14, color: "var(--text-dim)", fontSize: 12 }}>
            no candidates submitted yet
          </div>
        )}
        {ranked.map((c, i) => {
          const selected = c.id === selectedId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                background: selected ? "var(--bg-raised)" : "transparent",
                border: "none",
                borderBottom: "1px solid var(--bg-line)",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <span className="t-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>#{i + 1}</span>
                <span className="t-mono" style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  {c.score.toFixed(2)}
                </span>
              </div>
              <div
                className="t-mono"
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  wordBreak: "break-all",
                  marginTop: 2,
                }}
              >
                {c.sequence}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10, color: "var(--text-dim)" }}>
                <span className="t-mono">ΔG <span style={{ color: "var(--text-muted)" }}>{c.delta_g.toFixed(1)}</span></span>
                <span className="t-mono">ipTM <span style={{ color: "var(--text-muted)" }}>{c.iptm.toFixed(2)}</span></span>
                {c.stress_test && (
                  <span style={{ color: c.stress_test.verdict === "pass" ? "var(--good)" : c.stress_test.verdict === "fail" ? "var(--warn)" : "var(--text-muted)" }}>
                    stress: {c.stress_test.verdict}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
