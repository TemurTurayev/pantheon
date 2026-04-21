import type { HotspotAnnotation } from "../types";

interface Props {
  residue: number | null;
  hotspots: HotspotAnnotation[];
  onClear: () => void;
}

// Scanner-style pop-up card (inspired by No Man's Sky / Zelda scanner).

export function ResidueInfoCard({ residue, hotspots, onClear }: Props) {
  if (residue === null) return null;
  const hit = hotspots.find((h) => h.residue === residue);

  return (
    <div
      className="panel-raised"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 280,
        padding: 14,
        zIndex: 3,
        animation: "scan-in var(--motion-slow) var(--ease-standard)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="t-label" style={{ color: "var(--accent-cyan)" }}>SCAN</span>
        <button
          onClick={onClear}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <div className="t-display" style={{ fontSize: 20, marginBottom: 4 }}>
        {hit?.label ?? `Residue ${residue}`}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
        position · <span className="t-mono" style={{ color: "var(--text-primary)" }}>{residue}</span>
      </div>

      {hit ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 4,
                background: "color-mix(in oklab, var(--accent-amber) 18%, transparent)",
                color: "var(--accent-amber)",
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              {hit.role}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5 }}>
            {hit.explainer}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
          No annotation for this residue. It's part of the structural backbone — it gives the protein its shape but isn't flagged as functionally critical for this target.
        </div>
      )}

      <style>{`
        @keyframes scan-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
