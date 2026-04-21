import type { ColorTheme, Representation } from "./MolstarViewer";

interface Props {
  representation: Representation;
  colorTheme: ColorTheme;
  onRepresentation: (r: Representation) => void;
  onColorTheme: (t: ColorTheme) => void;
}

const REPS: { value: Representation; label: string }[] = [
  { value: "cartoon", label: "cartoon" },
  { value: "surface", label: "surface" },
  { value: "ball-and-stick", label: "atoms" },
];

const THEMES: { value: ColorTheme; label: string }[] = [
  { value: "chain-id", label: "chain" },
  { value: "residue-name", label: "residue" },
  { value: "hydrophobicity", label: "hydrophobicity" },
  { value: "plddt-confidence", label: "confidence" },
  { value: "sequence-id", label: "sequence" },
  { value: "element-symbol", label: "element" },
];

export function ViewerControls({ representation, colorTheme, onRepresentation, onColorTheme }: Props) {
  return (
    <div
      className="panel"
      style={{
        display: "flex",
        gap: 16,
        padding: "8px 12px",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="t-label">REPRESENTATION</span>
        <div style={{ display: "flex", gap: 4 }}>
          {REPS.map((r) => (
            <button
              key={r.value}
              onClick={() => onRepresentation(r.value)}
              className="btn"
              style={
                representation === r.value
                  ? { borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }
                  : {}
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="t-label">COLOR BY</span>
        <select
          value={colorTheme}
          onChange={(e) => onColorTheme(e.target.value as ColorTheme)}
          className="btn"
          style={{ cursor: "pointer" }}
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)" }}>
        drag · rotate · wheel · zoom · shift+drag · pan
      </div>
    </div>
  );
}
