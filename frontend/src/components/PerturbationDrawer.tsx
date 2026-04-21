import { useState } from "react";

export interface Perturbation {
  id: string;
  name: string;
  caption: string;        // played during the animation
  effect: string;         // one-liner of what the viewer shows
  compute: "client-fake" | "client-wasm" | "server-stub" | "server-real";
  duration_s: number;
  icon: string;
}

// 10 presets synthesized from the perturbation research agent, ordered
// by "ships first" priority so the UI reads from cheap-client to real-MD.
export const PERTURBATIONS: Perturbation[] = [
  { id: "freeze",    name: "Cryo freeze (100 K)",       caption: "Thermal motion frozen out",                    effect: "B-factors drop, ice-blue tint, motion damps",  compute: "client-fake", duration_s: 3, icon: "❄️" },
  { id: "heatshock", name: "Heat shock (37→70 °C)",     caption: "Thermal energy unfolding weak contacts",       effect: "Colour ramps blue→red, vertices vibrate",      compute: "client-fake", duration_s: 4, icon: "🔥" },
  { id: "oxidative", name: "Oxidative stress (ROS)",    caption: "Methionines and cysteines oxidize",            effect: "Met/Cys flash yellow, orange oxidised state",   compute: "client-fake", duration_s: 3, icon: "⚡" },
  { id: "urea",      name: "Denaturant (6 M urea)",     caption: "Urea disrupts hydrophobic core",               effect: "Surface pulses, hydrophobic patches dissolve",  compute: "client-fake", duration_s: 4, icon: "🌊" },
  { id: "lowph",     name: "pH drop (7.4 → 4.0)",       caption: "Histidines protonate, surface charge inverts", effect: "His rotamers flip, electrostatic recolor",      compute: "client-fake", duration_s: 4, icon: "🧪" },
  { id: "trypsin",   name: "Trypsin cleavage",          caption: "Trypsin cleaves after lysine and arginine",    effect: "Backbone splits at K/R, fragments drift",       compute: "client-fake", duration_s: 5, icon: "✂️" },
  { id: "membrane",  name: "Lipid membrane insertion",  caption: "Hydrophobic belt anchors into membrane",       effect: "Slides into bilayer plane, belt glows",         compute: "client-fake", duration_s: 5, icon: "🧊" },
  { id: "mutscan",   name: "Mutation scan",             caption: "Swapping residue, re-scoring affinity",        effect: "One residue morphs, Boltz score updates",       compute: "server-stub", duration_s: 4, icon: "🔄" },
  { id: "pull",      name: "Mechanical pull (AFM)",     caption: "Pulling C-terminus, elastic network responds", effect: "Terminal residue drags, ENM propagates",        compute: "client-wasm", duration_s: 6, icon: "🪝" },
  { id: "md",        name: "Real MD · 200 ps",          caption: "Running molecular dynamics, 200 picoseconds",  effect: "True OpenMM trajectory streams frame-by-frame", compute: "server-real", duration_s: 30, icon: "🧬" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onLaunch: (p: Perturbation) => void;
  accent?: string;
}

export function PerturbationDrawer({ open, onClose, onLaunch, accent = "var(--accent-cyan)" }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <aside
      role="dialog"
      aria-label="Apply substance or stress"
      aria-hidden={!open}
      style={{
        position: "absolute",
        right: open ? 0 : -460,
        top: 0,
        bottom: 0,
        width: 420,
        background: "color-mix(in oklab, var(--bg-panel) 92%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid var(--bg-line)",
        transition: "right 240ms var(--ease-standard)",
        padding: 20,
        overflowY: "auto",
        zIndex: 25,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div className="t-label" style={{ color: accent, marginBottom: 4 }}>APPLY SUBSTANCE · STRESS TEST</div>
          <div style={{ fontSize: 18, color: "var(--text-primary)", fontWeight: 600 }}>
            Pick one — it plays in the viewer
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close perturbation drawer"
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>
        Each effect plays as a short animation with a plain-language caption. "Client fake" = instant, illustrative.
        "Server real" = OpenMM GPU job, waits a few minutes, streams real frames back.
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {PERTURBATIONS.map((p) => {
          const isSelected = selected === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => setSelected(p.id)}
                aria-label={`${p.name}. ${p.caption}`}
                aria-pressed={isSelected}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: isSelected ? "var(--bg-raised)" : "var(--bg-panel)",
                  border: "1px solid",
                  borderColor: isSelected ? accent : "var(--bg-line)",
                  borderRadius: 6,
                  color: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  transition: "border-color var(--motion-fast) var(--ease-standard)",
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">{p.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{p.name}</span>
                    <span className="t-meta">{p.duration_s}s · {p.compute}</span>
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                    {p.effect}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        onClick={() => {
          const hit = PERTURBATIONS.find((p) => p.id === selected);
          if (hit) onLaunch(hit);
        }}
        disabled={!selected}
        className="btn btn-primary"
        style={{
          marginTop: 14,
          width: "100%",
          padding: 10,
          opacity: selected ? 1 : 0.5,
          cursor: selected ? "pointer" : "not-allowed",
        }}
      >
        ▶  Play selected perturbation  {selected && `· ${PERTURBATIONS.find(p => p.id === selected)?.duration_s}s`}
      </button>

      <div className="t-meta" style={{ marginTop: 14, textAlign: "center" }}>
        press ESC to close · A to reopen · 1–9 to quick-pick
      </div>
    </aside>
  );
}
