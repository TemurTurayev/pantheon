import { useEffect, useState } from "react";
import type { PerturbationPreset } from "./PerturbationDrawer";

export interface ActivePerturbation {
  preset: PerturbationPreset;
  durationS: number;
  temperature?: number;
  intensity?: number;
}

interface Props {
  active: ActivePerturbation | null;
  playing: boolean;
  onComplete: () => void;
  onProgress?: (p: number) => void;
}

// Overlay layer — SVG + CSS motifs per perturbation, driven by a
// requestAnimationFrame loop with a progress curve. Parameters (duration,
// temperature, intensity) scale the visible intensity in real time.
export function PerturbationEffect({ active, playing, onComplete, onProgress }: Props) {
  const [progress, setProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Live animation loop.
  useEffect(() => {
    if (!active || !playing) {
      return;
    }
    const total = active.durationS * 1000;
    const startTime = performance.now() - elapsedMs;
    let raf = 0;

    const tick = (t: number) => {
      const ms = t - startTime;
      const p = Math.min(1, ms / total);
      setElapsedMs(ms);
      setProgress(p);
      onProgress?.(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // elapsedMs is intentionally read once at start to handle pause/resume;
    // we re-run the effect when `playing` flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.preset.id, active?.durationS, playing]);

  // Reset when a new perturbation starts.
  useEffect(() => {
    if (!active) {
      setProgress(0);
      setElapsedMs(0);
      return;
    }
    setProgress(0);
    setElapsedMs(0);
  }, [active?.preset.id]);

  if (!active) return null;
  const style = effectStyle(active, progress);

  return (
    <>
      {/* Filter layer over the Mol* canvas */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          background: style.background,
          opacity: style.opacity,
          transition: "background 500ms var(--ease-standard), opacity 240ms var(--ease-standard)",
          zIndex: 6,
        }}
      />

      {style.motifs && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7 }}>
          {style.motifs}
        </div>
      )}

      {/* Slim top progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 30 }}>
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: "var(--accent-amber)",
            transition: "width 120ms linear",
          }}
        />
      </div>
    </>
  );
}

// Compute the host-level CSS filter for the Mol* canvas. Driven by
// temperature / intensity so the molecule itself visibly changes.
export function hostFilterFor(active: ActivePerturbation | null, progress: number): string | undefined {
  if (!active) return undefined;
  const p = progress;
  switch (active.preset.id) {
    case "freeze": {
      // Lower temperature → more desaturated + blue cast.
      const t = active.temperature ?? 100;
      const chill = 1 - Math.min(1, (t - 77) / (200 - 77));   // 1 at 77K, 0 at 200K
      const saturate = 1 - 0.6 * chill * p;
      const hue = -20 * chill * p;                            // push toward blue
      const brightness = 1 - 0.15 * chill * p;
      return `saturate(${saturate.toFixed(2)}) hue-rotate(${hue.toFixed(0)}deg) brightness(${brightness.toFixed(2)})`;
    }
    case "heatshock": {
      const t = active.temperature ?? 70;
      const heat = Math.min(1, Math.max(0, (t - 37) / (95 - 37)));
      const hue = 20 * heat * p;                              // push toward red/orange
      const saturate = 1 + 0.5 * heat * p;
      const brightness = 1 + 0.05 * heat * p;
      // Add a subtle shake via brightness oscillation (filter is layout-safe)
      const wobble = 1 + 0.04 * heat * Math.sin(p * Math.PI * 12);
      return `hue-rotate(${hue.toFixed(0)}deg) saturate(${(saturate * wobble).toFixed(2)}) brightness(${brightness.toFixed(2)})`;
    }
    case "oxidative": {
      const i = (active.intensity ?? 60) / 100;
      const hue = 25 * i * p;
      const saturate = 1 + 0.4 * i * p;
      return `hue-rotate(${hue.toFixed(0)}deg) saturate(${saturate.toFixed(2)})`;
    }
    case "urea": {
      const i = (active.intensity ?? 6) / 10;
      const blur = 1.5 * i * p;
      const saturate = 1 - 0.3 * i * p;
      return `blur(${blur.toFixed(2)}px) saturate(${saturate.toFixed(2)})`;
    }
    case "lowph": {
      // Map pH slider inverted: low pH → more shift.
      const ph = active.intensity ?? 4.0;
      const drop = Math.min(1, Math.max(0, (7.4 - ph) / (7.4 - 2)));
      const hue = 25 * drop * p;
      const saturate = 1 + 0.3 * drop * p;
      return `hue-rotate(${hue.toFixed(0)}deg) saturate(${saturate.toFixed(2)})`;
    }
    case "trypsin": {
      const brightness = 1 - 0.08 * p;
      return `brightness(${brightness.toFixed(2)})`;
    }
    case "membrane": {
      const i = (active.intensity ?? 70) / 100;
      const saturate = 1 + 0.2 * i * p;
      const hue = -10 * i * p;
      return `hue-rotate(${hue.toFixed(0)}deg) saturate(${saturate.toFixed(2)})`;
    }
    case "md": {
      // Real-MD: subtle temperature tint to distinguish 310K cold run vs 400K hot.
      const t = active.temperature ?? 310;
      const heat = Math.min(1, Math.max(0, (t - 280) / (400 - 280)));
      const hue = 10 * heat * p;
      const saturate = 1 + 0.15 * heat * p;
      return `hue-rotate(${hue.toFixed(0)}deg) saturate(${saturate.toFixed(2)})`;
    }
    default:
      return undefined;
  }
}

function effectStyle(active: ActivePerturbation, p: number) {
  const intensityFactor = (active.intensity ?? 50) / 100;
  const tempFactor = active.temperature
    ? Math.abs(active.temperature - 273) / 150
    : 1;

  switch (active.preset.id) {
    case "freeze":
      return {
        background: `radial-gradient(ellipse at center, rgba(140,220,255,${0.2 + 0.45 * p}) 0%, rgba(50,120,180,${0.1 * p}) 60%, transparent 100%)`,
        opacity: 0.85,
        motifs: <IceCrystals density={0.6 + p * 0.4} />,
      };
    case "heatshock": {
      const heat = Math.min(1, Math.max(0, ((active.temperature ?? 70) - 37) / (95 - 37)));
      return {
        background: `radial-gradient(ellipse at center, rgba(255,90,40,${0.2 + 0.5 * heat * p}) 0%, rgba(255,160,40,${0.15 * heat * p}) 40%, transparent 80%)`,
        opacity: 1,
        motifs: <HeatWaves intensity={p * heat} />,
      };
    }
    case "oxidative":
      return {
        background: `radial-gradient(ellipse at center, rgba(255,220,80,${0.15 + 0.4 * intensityFactor * (0.5 + 0.5 * Math.sin(p * Math.PI * 4))}) 0%, transparent 60%)`,
        opacity: 1,
        motifs: <Sparks intensity={intensityFactor * p} />,
      };
    case "urea":
      return {
        background: `linear-gradient(180deg, rgba(200,255,255,${0.08 + 0.25 * intensityFactor * p}), rgba(160,200,255,${0.05 + 0.2 * intensityFactor * p}))`,
        opacity: 0.9,
        motifs: null,
      };
    case "lowph":
      return {
        background: `linear-gradient(180deg, rgba(255,180,80,${0.1 + 0.25 * p}), rgba(255,100,80,${0.08 + 0.25 * p}))`,
        opacity: 0.95,
        motifs: <Bubbles count={Math.floor(p * 20 * intensityFactor)} />,
      };
    case "trypsin":
      return {
        background: "transparent",
        opacity: 1,
        motifs: <CleavageScan progress={p} />,
      };
    case "membrane":
      return {
        background: `linear-gradient(180deg, transparent 0%, transparent ${55 - 8 * p}%, rgba(80,140,200,${0.35 * p}) ${55 - 8 * p}%, rgba(80,140,200,${0.35 * p}) ${65 + 8 * p}%, transparent ${65 + 8 * p}%)`,
        opacity: 1,
        motifs: null,
      };
    case "mutscan":
      return {
        background: "transparent",
        opacity: 1,
        motifs: <ReticleSweep progress={p} />,
      };
    case "pull":
      return {
        background: "transparent",
        opacity: 1,
        motifs: <PullVector progress={p} force={active.intensity ?? 200} />,
      };
    case "md":
      return {
        background: "transparent",
        opacity: 1,
        motifs: <TelemetryScan progress={p} temp={active.temperature ?? 310} />,
      };
    default:
      return { background: "transparent", opacity: 0, motifs: null };
  }
  // Silence unused-var warning
  void tempFactor;
}

// --- Motifs (decorative SVG) ---

function IceCrystals({ density }: { density: number }) {
  const n = Math.floor(density * 60);
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = (i * 163) % 100;
        const y = (i * 97) % 100;
        const r = 1.5 + (i % 4);
        return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="rgba(220,240,255,0.7)" />;
      })}
    </svg>
  );
}

function HeatWaves({ intensity }: { intensity: number }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="heat" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,120,40,0.7)" />
          <stop offset="100%" stopColor="rgba(255,120,40,0)" />
        </linearGradient>
      </defs>
      {Array.from({ length: 10 }).map((_, i) => {
        const x = 5 + i * 10;
        const h = 20 + intensity * 60;
        return (
          <path
            key={i}
            d={`M ${x}% 100% Q ${x + 3}% ${100 - h / 2}% ${x}% ${100 - h}%`}
            stroke="url(#heat)"
            fill="none"
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}

function Sparks({ intensity }: { intensity: number }) {
  const n = Math.floor(8 + intensity * 30);
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = (i * 47) % 100;
        const y = (i * 31) % 100;
        const r = 2 + intensity * 5;
        return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="rgba(255,230,120,0.85)" />;
      })}
    </svg>
  );
}

function Bubbles({ count }: { count: number }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i * 79) % 100;
        const y = 100 - ((i * 31) % 100);
        return (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={3 + (i % 4)}
            fill="none"
            stroke="rgba(255,200,120,0.7)"
            strokeWidth={1.2}
          />
        );
      })}
    </svg>
  );
}

function CleavageScan({ progress }: { progress: number }) {
  const y = progress * 100;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="cut" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,90,90,0)" />
          <stop offset="50%" stopColor="rgba(255,90,90,0.9)" />
          <stop offset="100%" stopColor="rgba(255,90,90,0)" />
        </linearGradient>
      </defs>
      <line x1="0" x2="100%" y1={`${y}%`} y2={`${y}%`} stroke="url(#cut)" strokeWidth={2.5} />
      <line x1="0" x2="100%" y1={`${y - 1.2}%`} y2={`${y - 1.2}%`} stroke="rgba(255,150,120,0.4)" strokeWidth={1} />
    </svg>
  );
}

function ReticleSweep({ progress }: { progress: number }) {
  const r = 15 + progress * 70;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <circle cx="50%" cy="50%" r={r} fill="none" stroke="rgba(92,207,230,0.7)" strokeWidth={1.5} strokeDasharray="6 4" />
      <circle cx="50%" cy="50%" r={r * 0.6} fill="none" stroke="rgba(92,207,230,0.4)" strokeWidth={1} />
    </svg>
  );
}

function PullVector({ progress, force }: { progress: number; force: number }) {
  const maxExt = Math.min(35, force / 15);
  const x2 = 50 + progress * maxExt;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <line x1="50%" y1="50%" x2={`${x2}%`} y2="50%" stroke="rgba(255,180,70,0.9)" strokeWidth={2} strokeDasharray="6 4" />
      <circle cx={`${x2}%`} cy="50%" r={4} fill="rgba(255,180,70,0.9)" />
    </svg>
  );
}

function TelemetryScan({ progress, temp }: { progress: number; temp: number }) {
  const x = progress * 100;
  const tHot = Math.min(1, Math.max(0, (temp - 280) / (400 - 280)));
  const stroke = `rgba(${92 + tHot * 160},${207 - tHot * 100},${230 - tHot * 120},0.6)`;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <line x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke={stroke} strokeWidth={1.5} />
      <rect x="0" y="0" width={`${x}%`} height="100%" fill={stroke.replace("0.6", "0.06")} />
    </svg>
  );
}
