import { useMemo, useState } from "react";

export interface PerturbationPreset {
  id: string;
  name: string;
  caption: string;
  effect: string;
  compute: "client-fake" | "client-wasm" | "server-stub" | "server-real";
  defaultDurationS: number;
  minDurationS: number;
  maxDurationS: number;
  icon: string;
  temperature?: {
    unit: "°C" | "K";
    min: number;
    max: number;
    default: number;
  };
  intensity?: {
    label: string;
    min: number;
    max: number;
    default: number;
    unit?: string;
  };
}

export const PERTURBATION_PRESETS: PerturbationPreset[] = [
  {
    id: "freeze",
    name: "Cryo freeze",
    caption: "Thermal motion frozen out",
    effect: "Ice-blue tint, motion damps, B-factors collapse",
    compute: "client-fake",
    defaultDurationS: 4,
    minDurationS: 2,
    maxDurationS: 15,
    icon: "❄️",
    temperature: { unit: "K", min: 77, max: 200, default: 100 },
  },
  {
    id: "heatshock",
    name: "Heat shock",
    caption: "Thermal energy unfolding weak contacts",
    effect: "Colour ramps blue→red, vertices vibrate",
    compute: "client-fake",
    defaultDurationS: 5,
    minDurationS: 2,
    maxDurationS: 20,
    icon: "🔥",
    temperature: { unit: "°C", min: 37, max: 95, default: 70 },
  },
  {
    id: "oxidative",
    name: "Oxidative stress",
    caption: "Methionines and cysteines oxidize",
    effect: "Met/Cys flash yellow, shift to orange oxidised state",
    compute: "client-fake",
    defaultDurationS: 4,
    minDurationS: 2,
    maxDurationS: 12,
    icon: "⚡",
    intensity: { label: "ROS concentration", min: 10, max: 100, default: 60, unit: "µM" },
  },
  {
    id: "urea",
    name: "Denaturant (urea)",
    caption: "Urea disrupts hydrophobic core",
    effect: "Surface pulses, hydrophobic patches dissolve",
    compute: "client-fake",
    defaultDurationS: 5,
    minDurationS: 2,
    maxDurationS: 15,
    icon: "🌊",
    intensity: { label: "Urea concentration", min: 1, max: 10, default: 6, unit: "M" },
  },
  {
    id: "lowph",
    name: "pH drop",
    caption: "Histidines protonate, surface charge inverts",
    effect: "His rotamers flip, electrostatic recolor",
    compute: "client-fake",
    defaultDurationS: 5,
    minDurationS: 2,
    maxDurationS: 15,
    icon: "🧪",
    intensity: { label: "pH", min: 2, max: 7.4, default: 4.0 },
  },
  {
    id: "trypsin",
    name: "Trypsin cleavage",
    caption: "Trypsin cleaves after lysine and arginine",
    effect: "Backbone splits at K/R, fragments drift",
    compute: "client-fake",
    defaultDurationS: 6,
    minDurationS: 3,
    maxDurationS: 15,
    icon: "✂️",
    intensity: { label: "Enzyme activity", min: 10, max: 100, default: 60, unit: "%" },
  },
  {
    id: "membrane",
    name: "Lipid membrane",
    caption: "Hydrophobic belt anchors into membrane",
    effect: "Slides into bilayer plane, belt glows",
    compute: "client-fake",
    defaultDurationS: 6,
    minDurationS: 3,
    maxDurationS: 15,
    icon: "🧊",
    intensity: { label: "Lipid density", min: 20, max: 100, default: 70, unit: "%" },
  },
  {
    id: "mutscan",
    name: "Mutation scan",
    caption: "Swapping residue, re-scoring affinity",
    effect: "One residue morphs, Boltz score updates",
    compute: "server-stub",
    defaultDurationS: 4,
    minDurationS: 2,
    maxDurationS: 10,
    icon: "🔄",
  },
  {
    id: "pull",
    name: "Mechanical pull (AFM)",
    caption: "Pulling C-terminus, elastic network responds",
    effect: "Terminal residue drags, ENM propagates",
    compute: "client-wasm",
    defaultDurationS: 7,
    minDurationS: 3,
    maxDurationS: 20,
    icon: "🪝",
    intensity: { label: "Pull force", min: 50, max: 500, default: 200, unit: "pN" },
  },
  {
    id: "md",
    name: "Real MD",
    caption: "Running molecular dynamics, live frames",
    effect: "True OpenMM trajectory streams frame-by-frame",
    compute: "server-real",
    defaultDurationS: 30,
    minDurationS: 10,
    maxDurationS: 300,
    icon: "🧬",
    temperature: { unit: "K", min: 280, max: 400, default: 310 },
  },
];

export interface PerturbationLaunch {
  preset: PerturbationPreset;
  durationS: number;
  temperature?: number;
  intensity?: number;
}

// Back-compat alias for older imports.
export type Perturbation = PerturbationPreset & { duration_s: number };

interface Props {
  open: boolean;
  onClose: () => void;
  onLaunch: (launch: PerturbationLaunch) => void;
  accent?: string;
}

export function PerturbationDrawer({ open, onClose, onLaunch, accent = "var(--accent-cyan)" }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => PERTURBATION_PRESETS.find((p) => p.id === selectedId) ?? null, [selectedId]);

  const [durationS, setDurationS] = useState<number>(4);
  const [temperature, setTemperature] = useState<number>(0);
  const [intensity, setIntensity] = useState<number>(0);

  const onPick = (p: PerturbationPreset) => {
    setSelectedId(p.id);
    setDurationS(p.defaultDurationS);
    setTemperature(p.temperature?.default ?? 0);
    setIntensity(p.intensity?.default ?? 0);
  };

  const launch = () => {
    if (!selected) return;
    onLaunch({
      preset: selected,
      durationS,
      temperature: selected.temperature ? temperature : undefined,
      intensity: selected.intensity ? intensity : undefined,
    });
  };

  return (
    <aside
      role="dialog"
      aria-label="Apply substance or stress"
      aria-hidden={!open}
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 440,
        transform: open ? "translateX(0)" : "translateX(100%)",
        background: "color-mix(in oklab, var(--bg-panel) 92%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid var(--bg-line)",
        transition: "transform 240ms var(--ease-standard)",
        padding: 20,
        overflowY: "auto",
        zIndex: 25,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div className="t-label" style={{ color: accent, marginBottom: 4 }}>APPLY · STRESS TEST</div>
          <div style={{ fontSize: 18, color: "var(--text-primary)", fontWeight: 600 }}>
            Pick one, tune the knobs
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

      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", display: "flex", flexDirection: "column", gap: 6 }}>
        {PERTURBATION_PRESETS.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => onPick(p)}
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
                    <span className="t-meta">{p.compute}</span>
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

      {selected && (
        <div
          className="panel-raised"
          style={{
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            borderColor: accent,
          }}
        >
          <div className="t-label" style={{ color: accent }}>PARAMETERS · {selected.name.toUpperCase()}</div>

          <Slider
            label="Duration"
            value={durationS}
            min={selected.minDurationS}
            max={selected.maxDurationS}
            step={0.5}
            unit="s"
            onChange={setDurationS}
            accent={accent}
          />

          {selected.temperature && (
            <Slider
              label="Temperature"
              value={temperature}
              min={selected.temperature.min}
              max={selected.temperature.max}
              step={1}
              unit={` ${selected.temperature.unit}`}
              onChange={setTemperature}
              accent={accent}
            />
          )}

          {selected.intensity && (
            <Slider
              label={selected.intensity.label}
              value={intensity}
              min={selected.intensity.min}
              max={selected.intensity.max}
              step={selected.intensity.max > 50 ? 1 : 0.1}
              unit={selected.intensity.unit ? ` ${selected.intensity.unit}` : ""}
              onChange={setIntensity}
              accent={accent}
            />
          )}
        </div>
      )}

      <button
        onClick={launch}
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
        ▶  Run {selected ? `${selected.name} · ${durationS}s` : "simulation"}
      </button>

      <div className="t-meta" style={{ marginTop: 14, textAlign: "center" }}>
        parameters remain live during playback — steer while it runs
      </div>
    </aside>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  accent: string;
}

function Slider({ label, value, min, max, step, unit, onChange, accent }: SliderProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="t-label">{label}</span>
        <span className="t-mono" style={{ fontSize: 13, color: "var(--text-primary)" }}>
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: accent, width: "100%" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-dim)" }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </label>
  );
}
