import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PerturbationDrawer, type PerturbationLaunch } from "../components/PerturbationDrawer";
import {
  PerturbationEffect,
  hostStyleFor,
  type ActivePerturbation,
} from "../components/PerturbationEffect";
import { MissionStressTest } from "../components/MissionStressTest";
import { ResidueInfoCard } from "../components/ResidueInfoCard";
import { ShortcutSheet } from "../components/ShortcutSheet";
import { ToastProvider, useToast } from "../components/ToastProvider";
import { Toolbox, type ToolGroup } from "../components/Toolbox";
import {
  IconAtoms,
  IconCartoon,
  IconExit,
  IconFlask,
  IconHelp,
  IconHome,
  IconHotspot,
  IconPalette,
  IconPause,
  IconPlay,
  IconRuler,
  IconSelect,
  IconSnapshot,
  IconSurface,
  IconZoom,
} from "../components/ToolIcons";
import { useKeyboard } from "../hooks/useKeyboard";
import { useRound } from "../data/useRound";
import type { ColorTheme, Representation } from "../components/MolstarViewer";

const MolstarViewer = lazy(() =>
  import("../components/MolstarViewer").then((m) => ({ default: m.MolstarViewer }))
);

const COLOR_ORDER: ColorTheme[] = [
  "chain-id",
  "residue-name",
  "hydrophobicity",
  "plddt-confidence",
  "sequence-id",
  "element-symbol",
];

function FullscreenInner() {
  const { pdbId } = useParams<{ pdbId: string }>();
  const round = useRound();
  const navigate = useNavigate();
  const { show } = useToast();

  const [representation, setRepresentation] = useState<Representation>("cartoon");
  const [colorThemeIdx, setColorThemeIdx] = useState(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<ActivePerturbation | null>(null);
  const [perturbProgress, setPerturbProgress] = useState(0);
  const [selectedResidue, setSelectedResidue] = useState<number | null>(null);
  const [missionOpen, setMissionOpen] = useState(true);

  const [chromeVisible, setChromeVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokeChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2500);
  }, []);
  useEffect(() => {
    pokeChrome();
    const events = ["mousemove", "mousedown", "click", "keydown", "wheel", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, pokeChrome, true));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, pokeChrome, true));
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pokeChrome]);

  const launchPerturb = useCallback(
    (launch: PerturbationLaunch) => {
      setActive({
        preset: launch.preset,
        durationS: launch.durationS,
        temperature: launch.temperature,
        intensity: launch.intensity,
      });
      setPerturbProgress(0);
      setPlaying(true);
      setDrawerOpen(false);
      show(`${launch.preset.name} running · ${launch.durationS}s`, "info", 2500);
    },
    [show]
  );

  const onPerturbComplete = useCallback(() => {
    setPlaying(false);
    if (active) show(`${active.preset.name} complete`, "good", 2200);
  }, [active, show]);

  const updateActiveParam = useCallback(
    (key: "durationS" | "temperature" | "intensity", value: number) => {
      setActive((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const cycleColor = useCallback(() => {
    setColorThemeIdx((i) => {
      const next = (i + 1) % COLOR_ORDER.length;
      show(`color: ${COLOR_ORDER[next]}`, "info", 1500);
      return next;
    });
  }, [show]);

  const snapshot = useCallback(() => {
    show("snapshot copied to downloads (stub)", "good", 2000);
  }, [show]);

  const onResidueClick = useCallback((residue: number) => {
    setSelectedResidue(residue);
    setChromeVisible(true);
  }, []);

  const clearResidueSelection = useCallback(() => setSelectedResidue(null), []);

  useKeyboard({
    Escape: () => {
      if (shortcutOpen) setShortcutOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
      else if (selectedResidue != null) clearResidueSelection();
      else if (active && playing) setPlaying(false);
      else navigate(-1);
    },
    "?": () => setShortcutOpen((o) => !o),
    f: () => navigate(-1),
    F: () => navigate(-1),
    a: () => setDrawerOpen((o) => !o),
    A: () => setDrawerOpen((o) => !o),
    " ": () => {
      if (active) setPlaying((p) => !p);
      else setDrawerOpen(true);
    },
    "1": () => setRepresentation("cartoon"),
    "2": () => setRepresentation("surface"),
    "3": () => setRepresentation("ball-and-stick"),
    c: cycleColor,
    C: cycleColor,
    t: () => setShowHotspots((v) => !v),
    T: () => setShowHotspots((v) => !v),
    p: snapshot,
    P: snapshot,
    h: () => show("camera reset to home", "info", 1500),
    H: () => show("camera reset to home", "info", 1500),
  });

  if (!round) {
    return (
      <div style={{ padding: 24, color: "var(--text-muted)" }} role="status" aria-live="polite">
        loading round…
      </div>
    );
  }

  const tgt = (pdbId ?? round.target_pdb).toUpperCase();
  const accent = round.players[0]?.color ?? "var(--accent-cyan)";
  const hostStyle = active && playing ? hostStyleFor(active, perturbProgress) : {};
  const highlightResidues = selectedResidue != null ? [selectedResidue] : undefined;

  const groups: ToolGroup[] = [
    {
      id: "view",
      label: "VIEW",
      tools: [
        { id: "home", label: "Home view",      icon: <IconHome />, shortcut: "H", onClick: () => show("camera reset to home", "info", 1500) },
        { id: "zoom", label: "Zoom to focus",  icon: <IconZoom />, shortcut: "Z", onClick: () => show("zoomed to hotspot pocket", "info", 1500) },
      ],
    },
    {
      id: "style",
      label: "STYLE",
      tools: [
        { id: "cartoon", label: "Cartoon",           icon: <IconCartoon />, shortcut: "1", active: representation === "cartoon",        onClick: () => setRepresentation("cartoon") },
        { id: "surface", label: "Surface",           icon: <IconSurface />, shortcut: "2", active: representation === "surface",        onClick: () => setRepresentation("surface") },
        { id: "atoms",   label: "Ball-and-stick",    icon: <IconAtoms />,   shortcut: "3", active: representation === "ball-and-stick", onClick: () => setRepresentation("ball-and-stick") },
        { id: "color",   label: "Cycle color theme", icon: <IconPalette />, shortcut: "C", onClick: cycleColor },
        { id: "hot",     label: "Toggle hotspots",   icon: <IconHotspot />, shortcut: "T", active: showHotspots, onClick: () => setShowHotspots((v) => !v) },
      ],
    },
    {
      id: "analyze",
      label: "ANALYZE",
      tools: [
        { id: "ruler",  label: "Measure distance", icon: <IconRuler />,  shortcut: "M", onClick: () => show("drag between two atoms (stub)", "info", 1800) },
        { id: "select", label: "Select residue",   icon: <IconSelect />, shortcut: "S", onClick: () => show("click a residue to open scanner", "info", 1800) },
      ],
    },
    {
      id: "capture",
      label: "CAPTURE",
      tools: [
        { id: "snap", label: "Snapshot PNG", icon: <IconSnapshot />, shortcut: "P", onClick: snapshot },
      ],
    },
    {
      id: "sim",
      label: "SIMULATE",
      accent: true,
      tools: [
        { id: "apply", label: "Apply substance", icon: <IconFlask />, shortcut: "A", accent: true, onClick: () => setDrawerOpen(true) },
        { id: "play",  label: playing ? "Pause" : "Play simulation", icon: playing ? <IconPause /> : <IconPlay />, shortcut: "Space", accent: true, onClick: () => { if (active) setPlaying((p) => !p); else setDrawerOpen(true); } },
        { id: "mission", label: missionOpen ? "Hide mission test" : "Show mission test", icon: <IconHotspot />, shortcut: "U", accent: true, active: missionOpen, onClick: () => setMissionOpen((o) => !o) },
      ],
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg-void)",
        overflow: "hidden",
        cursor: chromeVisible ? "default" : "none",
      }}
      role="main"
      aria-label="Fullscreen molecular viewer"
    >
      <Suspense fallback={<div style={{ padding: 24, color: "var(--text-muted)" }}>loading viewer…</div>}>
        <MolstarViewer
          pdbId={tgt}
          representation={representation}
          colorTheme={COLOR_ORDER[colorThemeIdx]}
          hotspots={showHotspots ? round.hotspots : []}
          binderColor={accent}
          focusPocket={false}
          hideChrome
          hostFilter={hostStyle.filter}
          hostTransform={hostStyle.transform}
          hostOpacity={hostStyle.opacity}
          highlightResidues={highlightResidues}
          highlightColor={accent}
          focusOnResidue={selectedResidue}
          focusRadius={10}
          onResidueClick={onResidueClick}
          accessibleDescription={`Fullscreen 3D view of ${tgt}. ${representation}, ${COLOR_ORDER[colorThemeIdx]}.`}
        />
      </Suspense>

      <PerturbationEffect
        active={active}
        playing={playing}
        onComplete={onPerturbComplete}
        onProgress={setPerturbProgress}
      />

      {/* Hotspot quick-pick — clickable list of annotated residues. Sits in
          a safe band (bottom-right). Provides a guaranteed path to the
          residue scanner card even if Mol*'s pick fails. */}
      {showHotspots && round.hotspots.length > 0 && (
        <aside
          aria-label="Hotspot quick-pick"
          style={{
            position: "absolute",
            right: 16,
            bottom: active ? 96 : 16,
            width: 220,
            background: "color-mix(in oklab, var(--bg-panel) 92%, transparent)",
            border: "1px solid var(--bg-line)",
            borderRadius: 8,
            padding: 10,
            zIndex: 22,
            transition: "bottom 240ms var(--ease-standard)",
          }}
        >
          <div className="t-label" style={{ marginBottom: 6, color: "var(--accent-amber)" }}>
            HOTSPOTS · click to inspect
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {round.hotspots.map((h) => (
              <button
                key={h.residue}
                onClick={() => onResidueClick(h.residue)}
                aria-pressed={selectedResidue === h.residue}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "baseline",
                  padding: "5px 8px",
                  background: selectedResidue === h.residue ? "var(--bg-raised)" : "transparent",
                  border: "1px solid",
                  borderColor: selectedResidue === h.residue ? "var(--accent-amber)" : "transparent",
                  borderRadius: 4,
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                <span className="t-mono" style={{ color: "var(--accent-amber)", minWidth: 56 }}>{h.label}</span>
                <span style={{ color: "var(--text-muted)" }}>{h.role}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Residue info card — fixed to a safe band so it never clips the toolbox */}
      {selectedResidue != null && (
        <div style={{ position: "absolute", top: 72, right: 16, zIndex: 35, maxWidth: 320 }}>
          <ResidueInfoCard
            residue={selectedResidue}
            hotspots={round.hotspots}
            onClear={clearResidueSelection}
          />
        </div>
      )}

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 52,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "linear-gradient(to bottom, color-mix(in oklab, var(--bg-void) 82%, transparent) 30%, transparent 100%)",
          opacity: chromeVisible ? 1 : 0,
          transition: "opacity 280ms var(--ease-standard)",
          pointerEvents: chromeVisible ? "auto" : "none",
          zIndex: 30,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Exit fullscreen"
          className="btn"
          style={{ padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <IconExit /> <span>Exit · F</span>
        </button>

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, minWidth: 0 }}>
          <span className="t-label" style={{ fontSize: 9 }}>FULLSCREEN VIEWER</span>
          <span style={{ fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            target · <strong>{round.target_id}</strong> · PDB {tgt}
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <Chip>{representation}</Chip>
          <Chip>{COLOR_ORDER[colorThemeIdx]}</Chip>
          <button
            className="btn"
            onClick={() => setShortcutOpen(true)}
            aria-label="Open keyboard shortcuts"
            style={{ padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            <IconHelp /> <span>?</span>
          </button>
        </div>
      </div>

      <Toolbox groups={groups} visible={chromeVisible} />

      {active && (
        <LivePlaybackBar
          active={active}
          playing={playing}
          accent={accent}
          progress={perturbProgress}
          onTogglePlay={() => setPlaying((p) => !p)}
          onClear={() => {
            setPlaying(false);
            setActive(null);
            setPerturbProgress(0);
          }}
          onParamChange={updateActiveParam}
        />
      )}

      {round.stress_goal && missionOpen && (
        <MissionStressTest
          goal={round.stress_goal}
          active={active}
          progress={perturbProgress}
          playing={playing}
          accent={accent}
          onLaunch={launchPerturb}
        />
      )}

      <PerturbationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLaunch={launchPerturb}
        accent={accent}
      />

      <ShortcutSheet open={shortcutOpen} onClose={() => setShortcutOpen(false)} />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="t-mono"
      style={{
        fontSize: 11,
        padding: "3px 8px",
        background: "var(--bg-panel)",
        border: "1px solid var(--bg-line)",
        borderRadius: 999,
        color: "var(--text-muted)",
      }}
    >
      {children}
    </span>
  );
}

interface LivePlaybackBarProps {
  active: ActivePerturbation;
  playing: boolean;
  accent: string;
  progress: number;
  onTogglePlay: () => void;
  onClear: () => void;
  onParamChange: (key: "durationS" | "temperature" | "intensity", value: number) => void;
}

function LivePlaybackBar({ active, playing, accent, progress, onTogglePlay, onClear, onParamChange }: LivePlaybackBarProps) {
  const { preset, durationS, temperature, intensity } = active;
  const columnCount = 1 + (preset.temperature ? 1 : 0) + (preset.intensity ? 1 : 0);

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 16,
        bottom: 16,
        padding: "12px 16px",
        background: "color-mix(in oklab, var(--bg-panel) 94%, transparent)",
        border: `1px solid ${playing ? accent : "var(--bg-line)"}`,
        borderRadius: 10,
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 16,
        alignItems: "center",
        zIndex: 31,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        maxWidth: "calc(100% - 96px)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
        <button
          className="btn btn-primary"
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Play"}
          style={{ padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <span style={{ fontSize: 22 }} aria-hidden="true">{preset.icon}</span>
        <div style={{ minWidth: 0 }}>
          <div className="t-label" style={{ color: accent }}>
            {playing ? "LIVE · " : "PAUSED · "}{preset.compute.toUpperCase()}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, whiteSpace: "nowrap" }}>
            {preset.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {preset.caption}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: 16 }}>
        <MiniSlider
          label="Duration"
          value={durationS}
          min={preset.minDurationS}
          max={preset.maxDurationS}
          step={0.5}
          unit="s"
          accent={accent}
          onChange={(v) => onParamChange("durationS", v)}
        />
        {preset.temperature && temperature != null && (
          <MiniSlider
            label="Temp"
            value={temperature}
            min={preset.temperature.min}
            max={preset.temperature.max}
            step={1}
            unit={preset.temperature.unit}
            accent={accent}
            onChange={(v) => onParamChange("temperature", v)}
          />
        )}
        {preset.intensity && intensity != null && (
          <MiniSlider
            label={preset.intensity.label}
            value={intensity}
            min={preset.intensity.min}
            max={preset.intensity.max}
            step={preset.intensity.max > 50 ? 1 : 0.1}
            unit={preset.intensity.unit ?? ""}
            accent={accent}
            onChange={(v) => onParamChange("intensity", v)}
          />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <span className="t-mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>
          {(progress * durationS).toFixed(1)}s / {durationS}s
        </span>
        <div style={{ width: 120, height: 4, background: "var(--bg-line)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: accent }} />
        </div>
        <button className="btn" onClick={onClear} aria-label="Clear perturbation" style={{ fontSize: 11 }}>
          Clear
        </button>
      </div>
    </div>
  );
}

interface MiniSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  accent: string;
  onChange: (v: number) => void;
}

function MiniSlider({ label, value, min, max, step, unit, accent, onChange }: MiniSliderProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 120 }}>
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="t-label" style={{ fontSize: 9 }}>{label}</span>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--text-primary)" }}>
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
        style={{ accentColor: accent, width: "100%", cursor: "ew-resize" }}
      />
    </label>
  );
}

export function FullscreenViewerPage() {
  return (
    <ToastProvider>
      <FullscreenInner />
    </ToastProvider>
  );
}
