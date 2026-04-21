import { useEffect, useRef, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { StressTest } from "../types";

interface Props {
  stress: StressTest | null;
  color: string;
}

export function StressTestPanel({ stress, color }: Props) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);

  useEffect(() => {
    if (!stress || !playing) return;
    const step = (ts: number) => {
      if (ts - lastTs.current > 80) {
        lastTs.current = ts;
        setFrame((f) => {
          const next = f + 1;
          if (next >= stress.frames.length) {
            setPlaying(false);
            return stress.frames.length - 1;
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, stress]);

  if (!stress) {
    return (
      <div className="panel" style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="t-label">STRESS TEST</div>
        <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 10 }}>
          Select a candidate that has been stress-tested to see the trajectory here.
        </div>
      </div>
    );
  }

  const current = stress.frames[Math.min(frame, stress.frames.length - 1)];
  const integrity = current.q_native * 100;
  const verdict = stress.verdict;
  const verdictColor =
    verdict === "pass" ? "var(--good)" : verdict === "fail" ? "var(--warn)" : "var(--text-muted)";

  return (
    <div className="panel" style={{ padding: 14, height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="t-label">STRESS TEST</span>
        <span
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 4,
            background: `color-mix(in oklab, ${verdictColor} 18%, transparent)`,
            color: verdictColor,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {verdict}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{stress.condition}</div>

      {/* Integrity bar */}
      <div style={{ marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span className="t-label">INTEGRITY Q(t)</span>
          <span className="t-mono" style={{ color: "var(--text-primary)" }}>{integrity.toFixed(0)}%</span>
        </div>
        <div style={{ height: 8, background: "var(--bg-line)", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${integrity}%`,
              height: "100%",
              background: integrity > 80 ? "var(--good)" : integrity > 50 ? "var(--accent-amber)" : "var(--warn)",
              transition: "width var(--motion-fast) var(--ease-standard), background var(--motion-slow) var(--ease-standard)",
            }}
          />
        </div>
      </div>

      {/* Sparklines row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <Metric label="RMSD" value={current.rmsd.toFixed(2)} unit="Å" color={color}
                series={stress.frames.slice(0, frame + 1).map((f) => ({ v: f.rmsd }))} />
        <Metric label="Rg" value={current.rg.toFixed(2)} unit="Å" color={color}
                series={stress.frames.slice(0, frame + 1).map((f) => ({ v: f.rg }))} />
        <Metric label="H-BONDS" value={String(current.h_bonds)} unit="" color={color}
                series={stress.frames.slice(0, frame + 1).map((f) => ({ v: f.h_bonds }))} />
      </div>

      {/* Playback bar */}
      <div style={{ marginTop: 4 }}>
        <input
          type="range"
          min={0}
          max={stress.frames.length - 1}
          value={frame}
          onChange={(e) => {
            setPlaying(false);
            setFrame(parseInt(e.target.value, 10));
          }}
          style={{ width: "100%", accentColor: color }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-dim)" }}>
          <span className="t-mono">t = {current.t_ns.toFixed(2)} ns</span>
          <span>
            frame {frame + 1} / {stress.frames.length}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (frame >= stress.frames.length - 1) setFrame(0);
            setPlaying(!playing);
          }}
          style={{ flex: 1 }}
        >
          {playing ? "Pause" : frame >= stress.frames.length - 1 ? "Replay" : "Play"}
        </button>
        <button
          className="btn"
          onClick={() => {
            setPlaying(false);
            setFrame(0);
          }}
        >
          Reset
        </button>
      </div>

      {/* Event log */}
      <div
        className="t-mono"
        style={{
          flex: 1,
          overflowY: "auto",
          fontSize: 11,
          background: "var(--bg-void)",
          border: "1px solid var(--bg-line)",
          borderRadius: 4,
          padding: 8,
          minHeight: 80,
        }}
      >
        {stress.events
          .filter((e) => e.t_ns <= current.t_ns + 0.05)
          .slice(-8)
          .map((e, i) => (
            <div
              key={i}
              style={{
                color:
                  e.severity === "good"
                    ? "var(--good)"
                    : e.severity === "warn"
                    ? "var(--warn)"
                    : "var(--text-muted)",
                marginBottom: 2,
              }}
            >
              <span style={{ color: "var(--text-dim)" }}>t={e.t_ns.toFixed(2)}ns</span> · {e.text}
            </div>
          ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  color,
  series,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  series: { v: number }[];
}) {
  return (
    <div className="panel-raised" style={{ padding: 8 }}>
      <div className="t-label" style={{ fontSize: 9 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span className="t-mono" style={{ fontSize: 16, color: "var(--text-primary)" }}>{value}</span>
        <span className="t-meta">{unit}</span>
      </div>
      <div style={{ height: 24, marginTop: 2 }}>
        <ResponsiveContainer>
          <LineChart data={series}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <CartesianGrid stroke="transparent" />
            <Tooltip contentStyle={{ display: "none" }} />
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
