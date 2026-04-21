import { useEffect, useRef, useState } from "react";
import type { PerturbationPreset } from "./PerturbationDrawer";

export interface ActivePerturbation {
  preset: PerturbationPreset;
  durationS: number;
  temperature?: number;
  intensity?: number;
}

export interface HostStyle {
  filter?: string;
  transform?: string;
  opacity?: number;
}

interface Props {
  active: ActivePerturbation | null;
  playing: boolean;
  onComplete: () => void;
  onProgress?: (p: number) => void;
}

export function PerturbationEffect({ active, playing, onComplete, onProgress }: Props) {
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      elapsedRef.current = 0;
      lastTimestampRef.current = null;
      return;
    }
    if (!playing) {
      lastTimestampRef.current = null;
      return;
    }

    const total = active.durationS * 1000;
    let raf = 0;

    const tick = (t: number) => {
      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = t;
      }
      const dt = t - lastTimestampRef.current;
      lastTimestampRef.current = t;
      elapsedRef.current += dt;
      const p = Math.min(1, elapsedRef.current / total);
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
  }, [active, playing, onComplete, onProgress]);

  // Reset on new perturbation.
  useEffect(() => {
    elapsedRef.current = 0;
    lastTimestampRef.current = null;
    setProgress(0);
  }, [active?.preset.id]);

  if (!active) return null;
  const style = effectMotif(active, progress);

  return (
    <>
      {/* Hidden SVG turbulence filter — applied to canvas via CSS for real
          shimmer/heat distortion. The base frequency drives shimmer scale. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="pth-turb">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={String((style.turbFreq ?? 0).toFixed(4))}
            numOctaves="2"
            seed="3"
          />
          <feDisplacementMap in="SourceGraphic" scale={String((style.turbScale ?? 0).toFixed(1))} />
        </filter>
      </svg>

      {/* Color overlay layer */}
      {style.background && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            background: style.background,
            opacity: style.bgOpacity ?? 1,
            transition: "background 500ms var(--ease-standard)",
            zIndex: 6,
          }}
        />
      )}

      {style.motifs && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7 }}>
          {style.motifs}
        </div>
      )}

      {/* Top progress bar */}
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

// Computes the live host style that affects the molecule itself.
// Returns CSS filter + transform + opacity tied to params and progress.
export function hostStyleFor(active: ActivePerturbation | null, progress: number): HostStyle {
  if (!active) return {};

  const p = progress;
  const id = active.preset.id;

  switch (id) {
    case "freeze": {
      const t = active.temperature ?? 100;
      const chill = 1 - Math.min(1, (t - 77) / (200 - 77));   // 1 at 77K, 0 at 200K
      const sat = 1 - 0.7 * chill * p;
      const hue = -25 * chill * p;
      const bright = 1 - 0.18 * chill * p;
      const scale = 1 - 0.05 * chill * p;
      return {
        filter: `saturate(${sat.toFixed(2)}) hue-rotate(${hue.toFixed(0)}deg) brightness(${bright.toFixed(2)}) contrast(${(1 - 0.1 * chill * p).toFixed(2)})`,
        transform: `scale(${scale.toFixed(3)})`,
      };
    }

    case "heatshock": {
      const t = active.temperature ?? 70;
      const heat = Math.min(1, Math.max(0, (t - 37) / (95 - 37)));
      const intensity = heat * p;
      // Wobble grows superlinearly with heat × progress
      const wobble = intensity * intensity;
      const dx = Math.sin(p * Math.PI * 14) * wobble * 6;
      const dy = Math.cos(p * Math.PI * 11) * wobble * 4;
      const rot = Math.sin(p * Math.PI * 9) * wobble * 3;
      const hue = 25 * intensity;
      const sat = 1 + 0.6 * intensity;
      const bright = 1 + 0.08 * intensity;
      const blur = wobble * 1.2;
      // Late-stage "denaturation": at high heat × high progress the structure
      // visibly tears apart — opacity dips, scale grows, blur jumps.
      const denat = Math.max(0, intensity - 0.55) / 0.45;   // 0 until 55%, ramps to 1
      const opacity = 1 - 0.5 * denat;
      const scale = 1 + 0.08 * denat;
      const finalBlur = blur + denat * 5;
      return {
        filter: `hue-rotate(${hue.toFixed(0)}deg) saturate(${sat.toFixed(2)}) brightness(${bright.toFixed(2)}) blur(${finalBlur.toFixed(2)}px)`,
        transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
        opacity,
      };
    }

    case "oxidative": {
      const i = (active.intensity ?? 60) / 100;
      const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 8);
      return {
        filter: `hue-rotate(${(30 * i * p).toFixed(0)}deg) saturate(${(1 + 0.5 * i * p).toFixed(2)}) brightness(${(1 + 0.05 * pulse * i).toFixed(2)})`,
      };
    }

    case "urea": {
      const i = (active.intensity ?? 6) / 10;
      const blur = 4 * i * p;
      const sat = 1 - 0.5 * i * p;
      // At very high concentration + progress, opacity drops as if the
      // protein dissolves into the solvent.
      const opacity = 1 - 0.4 * Math.max(0, i * p - 0.4);
      return {
        filter: `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(2)})`,
        opacity,
      };
    }

    case "lowph": {
      const ph = active.intensity ?? 4.0;
      const drop = Math.min(1, Math.max(0, (7.4 - ph) / (7.4 - 2)));
      const hue = 35 * drop * p;
      const sat = 1 + 0.4 * drop * p;
      const skewX = drop * p * 2;
      return {
        filter: `hue-rotate(${hue.toFixed(0)}deg) saturate(${sat.toFixed(2)})`,
        transform: `skewX(${skewX.toFixed(2)}deg)`,
      };
    }

    case "trypsin": {
      // Cleavage scan crosses the structure; brightness flickers near the cut line.
      const flicker = 0.85 + 0.15 * (Math.sin(p * Math.PI * 30) > 0.6 ? 1 : 0);
      const opacity = 1 - 0.25 * Math.max(0, p - 0.6) / 0.4;   // mild fade after 60%
      return {
        filter: `brightness(${flicker.toFixed(2)})`,
        opacity,
      };
    }

    case "membrane": {
      const i = (active.intensity ?? 70) / 100;
      const sat = 1 + 0.25 * i * p;
      const hue = -12 * i * p;
      const dy = (1 - p) * 8;     // structure "settles" into the bilayer
      return {
        filter: `hue-rotate(${hue.toFixed(0)}deg) saturate(${sat.toFixed(2)})`,
        transform: `translate(0, ${dy.toFixed(1)}px)`,
      };
    }

    case "mutscan": {
      // Pulse around the residue under inspection.
      const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 6);
      return {
        filter: `brightness(${(1 + 0.05 * pulse).toFixed(2)})`,
      };
    }

    case "pull": {
      const force = active.intensity ?? 200;
      const factor = Math.min(1, force / 500);
      const skew = factor * p * 4;
      const dx = factor * p * 6;
      return {
        transform: `translate(${dx.toFixed(1)}px, 0) skewY(${skew.toFixed(2)}deg)`,
      };
    }

    case "md": {
      const t = active.temperature ?? 310;
      const heat = Math.min(1, Math.max(0, (t - 280) / (400 - 280)));
      // Real-MD: subtle continuous wobble scaled by temperature.
      const dx = Math.sin(p * Math.PI * 22) * heat * 1.5;
      const dy = Math.cos(p * Math.PI * 17) * heat * 1.2;
      const hue = 12 * heat * p;
      const sat = 1 + 0.15 * heat * p;
      return {
        filter: `hue-rotate(${hue.toFixed(0)}deg) saturate(${sat.toFixed(2)})`,
        transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`,
      };
    }

    default:
      return {};
  }
}

// Back-compat export — older callers expected a string filter.
export function hostFilterFor(active: ActivePerturbation | null, progress: number): string | undefined {
  return hostStyleFor(active, progress).filter;
}

// ---- overlay motifs (decorative) ----

interface Motif {
  background?: string;
  bgOpacity?: number;
  motifs?: React.ReactNode;
  turbFreq?: number;
  turbScale?: number;
}

function effectMotif(active: ActivePerturbation, p: number): Motif {
  const id = active.preset.id;
  const intensityFrac = (active.intensity ?? 50) / 100;

  switch (id) {
    case "freeze":
      return {
        background: `radial-gradient(ellipse at center, rgba(140,220,255,${0.2 + 0.45 * p}) 0%, rgba(50,120,180,${0.1 * p}) 60%, transparent 100%)`,
        bgOpacity: 0.85,
        motifs: <IceCrystals density={0.5 + p * 0.5} />,
      };
    case "heatshock": {
      const heat = Math.min(1, Math.max(0, ((active.temperature ?? 70) - 37) / (95 - 37)));
      return {
        background: `radial-gradient(ellipse at center, rgba(255,90,40,${0.2 + 0.5 * heat * p}) 0%, rgba(255,160,40,${0.15 * heat * p}) 40%, transparent 80%)`,
        motifs: <HeatWaves intensity={p * heat} />,
      };
    }
    case "oxidative":
      return {
        background: `radial-gradient(ellipse at center, rgba(255,220,80,${0.15 + 0.4 * intensityFrac * (0.5 + 0.5 * Math.sin(p * Math.PI * 4))}) 0%, transparent 60%)`,
        motifs: <Sparks intensity={intensityFrac * p} />,
      };
    case "urea":
      return {
        background: `linear-gradient(180deg, rgba(200,255,255,${0.08 + 0.25 * intensityFrac * p}), rgba(160,200,255,${0.05 + 0.2 * intensityFrac * p}))`,
        bgOpacity: 0.9,
      };
    case "lowph":
      return {
        background: `linear-gradient(180deg, rgba(255,180,80,${0.1 + 0.25 * p}), rgba(255,100,80,${0.08 + 0.25 * p}))`,
        motifs: <Bubbles count={Math.floor(p * 20 * intensityFrac)} />,
      };
    case "trypsin":
      return { motifs: <CleavageScan progress={p} /> };
    case "membrane":
      return {
        background: `linear-gradient(180deg, transparent 0%, transparent ${55 - 8 * p}%, rgba(80,140,200,${0.35 * p}) ${55 - 8 * p}%, rgba(80,140,200,${0.35 * p}) ${65 + 8 * p}%, transparent ${65 + 8 * p}%)`,
      };
    case "mutscan":
      return { motifs: <ReticleSweep progress={p} /> };
    case "pull":
      return { motifs: <PullVector progress={p} force={active.intensity ?? 200} /> };
    case "md":
      return { motifs: <TelemetryScan progress={p} temp={active.temperature ?? 310} /> };
    default:
      return {};
  }
}

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
