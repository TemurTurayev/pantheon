import { useEffect, useState } from "react";
import type { Perturbation } from "./PerturbationDrawer";

interface Props {
  perturbation: Perturbation | null;
  playing: boolean;
  onComplete: () => void;
}

// Overlays a CSS / SVG animation that matches the selected perturbation.
// Purely visual; a real backend-driven simulation would feed frames via
// the Mol* trajectory API — this gives the same "it's happening" feel
// while we wire the real path.

export function PerturbationEffect({ perturbation, playing, onComplete }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!perturbation || !playing) {
      setProgress(0);
      return;
    }
    const total = perturbation.duration_s * 1000;
    const start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [perturbation, playing, onComplete]);

  if (!perturbation || !playing) return null;

  const style = effectStyle(perturbation.id, progress);

  return (
    <>
      {/* Filter layer — sits over the viewer canvas. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          background: style.background,
          opacity: style.opacity,
          filter: style.filter,
          transition: "background 600ms var(--ease-standard), opacity 300ms var(--ease-standard)",
          zIndex: 6,
        }}
      />

      {/* Particle / motif layer specific to the effect */}
      {style.motifs && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 7,
          }}
        >
          {style.motifs}
        </div>
      )}

      {/* Per-effect timeline + label */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          minWidth: 320,
          padding: "10px 16px",
          background: "color-mix(in oklab, var(--bg-panel) 92%, transparent)",
          border: "1px solid var(--bg-line)",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 30,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ fontSize: 18 }} aria-hidden="true">
          {perturbation.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-label" style={{ color: "var(--accent-amber)", marginBottom: 3 }}>
            {perturbation.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {perturbation.caption}
          </div>
        </div>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {(progress * perturbation.duration_s).toFixed(1)}s / {perturbation.duration_s}s
        </span>
      </div>

      {/* Slim progress bar on the very top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "transparent",
          zIndex: 30,
        }}
      >
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

// Per-perturbation visual parameters.
// Each returns {background, opacity, filter, motifs?} tuned for the effect.
function effectStyle(id: string, p: number) {
  // helpful shared curves
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 4);       // wobble
  const rampIn = p < 0.8 ? p / 0.8 : 1 - (p - 0.8) / 0.2;    // fade out at end

  switch (id) {
    case "freeze":
      return {
        background: "radial-gradient(ellipse at center, rgba(140,220,255,0.35) 0%, rgba(50,120,180,0.12) 60%, transparent 100%)",
        opacity: 0.6 + 0.3 * p,
        filter: "",
        motifs: <IceCrystals density={0.7 * rampIn} />,
      };
    case "heatshock":
      return {
        background: `radial-gradient(ellipse at center, rgba(255,90,40,${0.2 + 0.35 * p}) 0%, rgba(255,160,40,${0.15 * p}) 40%, transparent 80%)`,
        opacity: 1,
        filter: `saturate(${1 + 0.4 * p})`,
        motifs: <HeatWaves intensity={p} />,
      };
    case "oxidative":
      return {
        background: `radial-gradient(ellipse at center, rgba(255,220,80,${0.1 + 0.4 * pulse}) 0%, transparent 60%)`,
        opacity: 1,
        filter: "",
        motifs: <Sparks pulse={pulse} />,
      };
    case "urea":
      return {
        background: `linear-gradient(180deg, rgba(200,255,255,${0.08 + 0.2 * pulse}), rgba(160,200,255,${0.05 + 0.15 * pulse}))`,
        opacity: rampIn,
        filter: `blur(${0.5 * p}px)`,
        motifs: null,
      };
    case "lowph":
      return {
        background: `linear-gradient(180deg, rgba(255,180,80,${0.1 + 0.2 * p}), rgba(255,100,80,${0.08 + 0.2 * p}))`,
        opacity: rampIn,
        filter: "",
        motifs: <Bubbles count={Math.floor(p * 12)} />,
      };
    case "trypsin":
      return {
        background: "transparent",
        opacity: 1,
        filter: "",
        motifs: <CleavageScan progress={p} />,
      };
    case "membrane":
      return {
        background: `linear-gradient(180deg, transparent 0%, transparent ${55 - 8 * rampIn}%, rgba(80,140,200,${0.3 * rampIn}) ${55 - 8 * rampIn}%, rgba(80,140,200,${0.3 * rampIn}) ${65 + 8 * rampIn}%, transparent ${65 + 8 * rampIn}%)`,
        opacity: 1,
        filter: "",
        motifs: null,
      };
    case "mutscan":
      return {
        background: "transparent",
        opacity: 1,
        filter: "",
        motifs: <ReticleSweep progress={p} />,
      };
    case "pull":
      return {
        background: "transparent",
        opacity: 1,
        filter: "",
        motifs: <PullVector progress={p} />,
      };
    case "md":
      return {
        background: "transparent",
        opacity: 1,
        filter: "",
        motifs: <TelemetryScan progress={p} />,
      };
    default:
      return { background: "transparent", opacity: 0, filter: "", motifs: null };
  }
}

// --- Motif components (pure SVG, accessible as decorative) ---

function IceCrystals({ density }: { density: number }) {
  const n = Math.floor(density * 40);
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = (i * 163) % 100;
        const y = (i * 97) % 100;
        return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={2 + (i % 3)} fill="rgba(220,240,255,0.6)" />;
      })}
    </svg>
  );
}

function HeatWaves({ intensity }: { intensity: number }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="heat" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,120,40,0.6)" />
          <stop offset="100%" stopColor="rgba(255,120,40,0)" />
        </linearGradient>
      </defs>
      {Array.from({ length: 6 }).map((_, i) => {
        const x = 10 + i * 14;
        const h = 20 + (intensity * 60);
        return (
          <path
            key={i}
            d={`M ${x}% 100% Q ${x + 4}% ${100 - h / 2}% ${x}% ${100 - h}%`}
            stroke="url(#heat)"
            fill="none"
            strokeWidth={1.5}
            style={{ transform: `translateY(${Math.sin((intensity * 6) + i) * 4}px)` }}
          />
        );
      })}
    </svg>
  );
}

function Sparks({ pulse }: { pulse: number }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (i * 47) % 100;
        const y = (i * 31) % 100;
        const r = 2 + pulse * 4;
        return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="rgba(255,230,120,0.8)" />;
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
            stroke="rgba(255,200,120,0.6)"
            strokeWidth={1}
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
          <stop offset="50%" stopColor="rgba(255,90,90,0.8)" />
          <stop offset="100%" stopColor="rgba(255,90,90,0)" />
        </linearGradient>
      </defs>
      <line x1="0" x2="100%" y1={`${y}%`} y2={`${y}%`} stroke="url(#cut)" strokeWidth={2} />
      <line x1="0" x2="100%" y1={`${y - 1}%`} y2={`${y - 1}%`} stroke="rgba(255,150,120,0.4)" strokeWidth={1} />
    </svg>
  );
}

function ReticleSweep({ progress }: { progress: number }) {
  const r = 20 + progress * 60;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <circle cx="50%" cy="50%" r={r} fill="none" stroke="rgba(92,207,230,0.7)" strokeWidth={1.5} strokeDasharray="6 4" />
      <circle cx="50%" cy="50%" r={r * 0.6} fill="none" stroke="rgba(92,207,230,0.4)" strokeWidth={1} />
    </svg>
  );
}

function PullVector({ progress }: { progress: number }) {
  const x1 = 50;
  const x2 = 50 + progress * 25;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <line x1={`${x1}%`} y1="50%" x2={`${x2}%`} y2="50%" stroke="rgba(255,180,70,0.9)" strokeWidth={2} strokeDasharray="6 4" />
      <polygon
        points={`${x2},48 ${x2 + 2},50 ${x2},52`}
        transform={`translate(0)`}
        fill="rgba(255,180,70,0.9)"
        style={{ transform: `translate(${x2}%, 50%)` }}
      />
    </svg>
  );
}

function TelemetryScan({ progress }: { progress: number }) {
  const x = progress * 100;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <line x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="rgba(92,207,230,0.5)" strokeWidth={1} />
      <rect x="0" y="0" width={`${x}%`} height="100%" fill="rgba(92,207,230,0.04)" />
    </svg>
  );
}
