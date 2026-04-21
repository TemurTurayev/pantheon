import { useEffect, useState } from "react";
import { PERTURBATION_PRESETS, type PerturbationLaunch } from "./PerturbationDrawer";
import type { ActivePerturbation } from "./PerturbationEffect";

export interface MissionStressGoal {
  id: string;
  description: string;          // "Binder must remain folded at 70°C heat shock"
  perturbationId: string;
  durationS: number;
  temperature?: number;
  intensity?: number;
  // Pass criterion described in plain language. The verdict logic is a
  // simple stub that compares against an in-test "Q(t) decay" model.
  passCriterion: string;
  passThreshold: number;        // 0..1 — fraction of "stability" remaining
}

interface Props {
  goal: MissionStressGoal | null;
  active: ActivePerturbation | null;
  progress: number;
  playing: boolean;
  accent: string;
  onLaunch: (launch: PerturbationLaunch) => void;
}

// Simulates Q(t) — fraction of native contacts remaining — based on the
// active perturbation's params and progress. Pure visual stub, but it
// behaves the way you'd expect: cold = stable, hot = decays, urea = decays
// faster, etc. The "verdict" reads out PASS or FAIL.
function estimateStability(active: ActivePerturbation | null, progress: number): number {
  if (!active) return 1;
  const id = active.preset.id;
  const p = progress;
  switch (id) {
    case "freeze":
      return 1; // freezing actually preserves
    case "heatshock": {
      const t = active.temperature ?? 70;
      const heat = Math.min(1, Math.max(0, (t - 37) / (95 - 37)));
      // Decay rate scales with heat; longer time + higher heat → lower Q.
      return Math.max(0, 1 - p * (0.4 + 0.7 * heat));
    }
    case "urea": {
      const i = (active.intensity ?? 6) / 10;
      return Math.max(0, 1 - p * (0.2 + 0.8 * i));
    }
    case "lowph": {
      const ph = active.intensity ?? 4.0;
      const drop = Math.min(1, Math.max(0, (7.4 - ph) / (7.4 - 2)));
      return Math.max(0, 1 - p * (0.15 + 0.5 * drop));
    }
    case "trypsin": {
      const i = (active.intensity ?? 60) / 100;
      return Math.max(0, 1 - p * (0.3 + 0.6 * i));
    }
    case "oxidative": {
      const i = (active.intensity ?? 60) / 100;
      return Math.max(0, 1 - p * (0.1 + 0.4 * i));
    }
    case "pull": {
      const f = (active.intensity ?? 200) / 500;
      return Math.max(0, 1 - p * (0.1 + 0.5 * f));
    }
    case "membrane":
      return Math.max(0.6, 1 - p * 0.3);
    case "mutscan":
      return 0.92 - 0.15 * p;
    case "md": {
      const t = active.temperature ?? 310;
      const heat = Math.min(1, Math.max(0, (t - 280) / (400 - 280)));
      return Math.max(0, 1 - p * (0.05 + 0.5 * heat));
    }
    default:
      return 1;
  }
}

export function MissionStressTest({ goal, active, progress, playing, accent, onLaunch }: Props) {
  const [verdict, setVerdict] = useState<"pending" | "running" | "pass" | "fail">("pending");
  const [finalQ, setFinalQ] = useState<number | null>(null);
  const stability = estimateStability(active, progress);

  useEffect(() => {
    if (!goal) return;
    if (!active || active.preset.id !== goal.perturbationId) {
      setVerdict("pending");
      setFinalQ(null);
      return;
    }
    if (playing) {
      setVerdict("running");
      setFinalQ(null);
      return;
    }
    if (progress >= 0.99) {
      const q = stability;
      setFinalQ(q);
      setVerdict(q >= goal.passThreshold ? "pass" : "fail");
    }
  }, [goal, active, playing, progress, stability]);

  if (!goal) return null;

  const preset = PERTURBATION_PRESETS.find((p) => p.id === goal.perturbationId);
  const verdictColor =
    verdict === "pass" ? "var(--good)" : verdict === "fail" ? "var(--warn)" : verdict === "running" ? accent : "var(--text-muted)";

  return (
    <div
      className="panel-raised"
      role="region"
      aria-label="Mission stress test"
      style={{
        position: "absolute",
        top: 72,
        left: 80,
        width: 360,
        padding: 14,
        zIndex: 28,
        borderColor: verdict === "running" ? accent : verdict === "pass" ? "var(--good)" : verdict === "fail" ? "var(--warn)" : "var(--bg-line)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="t-label" style={{ color: "var(--accent-amber)" }}>MISSION TEST</span>
        <span
          className="t-mono"
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: `color-mix(in oklab, ${verdictColor} 15%, transparent)`,
            color: verdictColor,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {verdict}
        </span>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 8 }}>
        {goal.description}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
        criterion · <span className="t-mono" style={{ color: "var(--text-primary)" }}>{goal.passCriterion}</span>
      </div>

      {/* Live Q(t) bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span className="t-label">STABILITY Q(t)</span>
          <span className="t-mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>
            {(stability * 100).toFixed(0)}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "var(--bg-line)",
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${stability * 100}%`,
              height: "100%",
              background:
                stability >= goal.passThreshold
                  ? "var(--good)"
                  : stability >= goal.passThreshold * 0.7
                  ? "var(--accent-amber)"
                  : "var(--warn)",
              transition: "width 120ms linear, background 240ms var(--ease-standard)",
            }}
          />
          {/* threshold marker */}
          <div
            style={{
              position: "absolute",
              left: `${goal.passThreshold * 100}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: "var(--text-muted)",
            }}
            aria-label={`Pass threshold ${goal.passThreshold * 100}%`}
          />
        </div>
        <div className="t-meta" style={{ marginTop: 3 }}>
          pass threshold {(goal.passThreshold * 100).toFixed(0)}%
        </div>
      </div>

      {finalQ != null && (
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            borderRadius: 4,
            background: verdict === "pass" ? "color-mix(in oklab, var(--good) 12%, transparent)" : "color-mix(in oklab, var(--warn) 12%, transparent)",
            color: verdict === "pass" ? "var(--good)" : "var(--warn)",
            fontSize: 12,
          }}
        >
          {verdict === "pass" ? "✓" : "✕"} Final Q(t) = {(finalQ * 100).toFixed(0)}% — binder {verdict === "pass" ? "passed" : "failed"} the mission criterion.
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={() => {
          if (!preset) return;
          onLaunch({
            preset,
            durationS: goal.durationS,
            temperature: goal.temperature,
            intensity: goal.intensity,
          });
        }}
        disabled={!preset || verdict === "running"}
        style={{ width: "100%", padding: 8, fontSize: 12 }}
      >
        {verdict === "running" ? "Running…" : verdict === "pass" || verdict === "fail" ? "Re-run mission test" : `▶  Run mission test · ${preset?.name ?? "?"}`}
      </button>
    </div>
  );
}
