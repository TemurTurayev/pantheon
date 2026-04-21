import { useEffect, useState } from "react";

// Powers-of-Ten cinematic zoom through 7 scale stops.
// Implemented as a narrated overlay + scale-bar. The actual Mol* camera
// movement is driven by a callback so this component stays presentation-only.

export interface DollyStop {
  id: number;
  label: string;
  scale: string;   // e.g. "10 nm"
  narration: string;
  representationHint: "cartoon" | "surface" | "ball-and-stick" | "context";
}

export const DOLLY_STOPS: DollyStop[] = [
  {
    id: 1,
    label: "Cell context",
    scale: "10 μm",
    narration: "Inside every one of your cells, millions of proteins are working — we're designing one that finds this one.",
    representationHint: "context",
  },
  {
    id: 2,
    label: "Target protein",
    scale: "10 nm",
    narration: "This is the target — a shape the disease depends on.",
    representationHint: "cartoon",
  },
  {
    id: 3,
    label: "Binding pocket",
    scale: "2 nm",
    narration: "Our binder has to fit here — like a key, but one we're inventing.",
    representationHint: "surface",
  },
  {
    id: 4,
    label: "Interface",
    scale: "1 nm",
    narration: "Shape alone isn't enough — the chemistry has to match too.",
    representationHint: "surface",
  },
  {
    id: 5,
    label: "Sidechains",
    scale: "5 Å",
    narration: "Each knob is an amino acid — the AI chose these specifically.",
    representationHint: "ball-and-stick",
  },
  {
    id: 6,
    label: "Hydrogen bonds",
    scale: "2 Å",
    narration: "These dashes are hydrogen bonds — the grip that holds it in place.",
    representationHint: "ball-and-stick",
  },
  {
    id: 7,
    label: "Single bond",
    scale: "1 Å",
    narration: "And this is one bond — a shared pair of electrons, the smallest unit of hold.",
    representationHint: "ball-and-stick",
  },
];

interface Props {
  onStopChange?: (stop: DollyStop) => void;
}

export function ScaleDolly({ onStopChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setCurrent((s) => {
        const next = s + 1;
        if (next > DOLLY_STOPS.length) {
          setPlaying(false);
          return DOLLY_STOPS.length;
        }
        return next;
      });
    }, 1300);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const stop = DOLLY_STOPS[current - 1];
    if (stop && onStopChange) onStopChange(stop);
  }, [current, onStopChange]);

  const stop = DOLLY_STOPS[current - 1] ?? DOLLY_STOPS[0];
  const pct = ((current - 1) / (DOLLY_STOPS.length - 1)) * 100;

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 12,
        width: 280,
        background: "color-mix(in oklab, var(--bg-panel) 92%, transparent)",
        border: "1px solid var(--bg-line)",
        borderRadius: 6,
        padding: 12,
        zIndex: 3,
      }}
      role="region"
      aria-label="Scale dolly navigator"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span className="t-label" style={{ color: "var(--accent-cyan)" }}>SCALE · {stop.scale}</span>
        <span className="t-meta">{current} / {DOLLY_STOPS.length}</span>
      </div>

      <div className="t-display" style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
        {stop.label}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10, minHeight: 54 }}>
        {stop.narration}
      </div>

      {/* Scale bar */}
      <div
        style={{
          height: 3,
          background: "var(--bg-line)",
          borderRadius: 2,
          position: "relative",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--accent-cyan)",
            borderRadius: 2,
            transition: "width 1000ms var(--ease-standard)",
          }}
        />
        {DOLLY_STOPS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setPlaying(false);
              setCurrent(s.id);
            }}
            aria-label={`Jump to ${s.label}`}
            style={{
              position: "absolute",
              top: "50%",
              left: `${((s.id - 1) / (DOLLY_STOPS.length - 1)) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: current >= s.id ? "var(--accent-cyan)" : "var(--bg-line)",
              border: `1px solid ${current === s.id ? "var(--accent-cyan)" : "var(--bg-raised)"}`,
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (current >= DOLLY_STOPS.length) setCurrent(1);
            setPlaying(!playing);
          }}
          style={{ flex: 1, fontSize: 11 }}
        >
          {playing ? "Pause" : current >= DOLLY_STOPS.length ? "Replay" : "Play dolly"}
        </button>
        <button
          className="btn"
          onClick={() => {
            setPlaying(false);
            setCurrent(1);
          }}
          style={{ fontSize: 11 }}
        >
          Reset
        </button>
      </div>

      <div className="t-meta" style={{ marginTop: 8, textAlign: "center", letterSpacing: "0.08em" }}>
        POWERS-OF-TEN · CELL → BOND
      </div>
    </div>
  );
}
