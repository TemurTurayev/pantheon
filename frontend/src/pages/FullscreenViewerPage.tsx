import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PerturbationDrawer, type Perturbation } from "../components/PerturbationDrawer";
import { PerturbationEffect } from "../components/PerturbationEffect";
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
  const [currentPerturb, setCurrentPerturb] = useState<Perturbation | null>(null);

  // Auto-hide logic — 2500ms idle.
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pokeChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2500);
  }, []);

  useEffect(() => {
    pokeChrome();
    window.addEventListener("mousemove", pokeChrome);
    window.addEventListener("keydown", pokeChrome);
    return () => {
      window.removeEventListener("mousemove", pokeChrome);
      window.removeEventListener("keydown", pokeChrome);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pokeChrome]);

  const launchPerturb = useCallback(
    (p: Perturbation) => {
      setCurrentPerturb(p);
      setDrawerOpen(false);
      setPlaying(true);
      show(`${p.name} — running ${p.duration_s}s`, "info", p.duration_s * 1000);
    },
    [show]
  );

  const onPerturbComplete = useCallback(() => {
    setPlaying(false);
    if (currentPerturb) show(`${currentPerturb.name} complete`, "good", 2500);
  }, [currentPerturb, show]);

  const cycleColor = useCallback(() => {
    setColorThemeIdx((i) => {
      const next = (i + 1) % COLOR_ORDER.length;
      show(`color: ${COLOR_ORDER[next]}`, "info", 1500);
      return next;
    });
  }, [show]);

  const snapshot = useCallback(() => {
    show("snapshot copied to downloads (stub)", "good", 2200);
  }, [show]);

  useKeyboard({
    Escape: () => {
      if (shortcutOpen) setShortcutOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
      else if (currentPerturb && playing) setPlaying(false);
      else navigate(-1);
    },
    "?": () => setShortcutOpen((o) => !o),
    f: () => navigate(-1),
    F: () => navigate(-1),
    a: () => setDrawerOpen((o) => !o),
    A: () => setDrawerOpen((o) => !o),
    " ": () => {
      if (currentPerturb) setPlaying((p) => !p);
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

  const groups: ToolGroup[] = [
    {
      id: "view",
      label: "VIEW",
      tools: [
        { id: "home", label: "Home view", icon: <IconHome />, shortcut: "H", onClick: () => show("camera reset to home", "info", 1500) },
        { id: "zoom", label: "Zoom to focus", icon: <IconZoom />, shortcut: "Z", onClick: () => show("zoomed to hotspot pocket", "info", 1500) },
      ],
    },
    {
      id: "style",
      label: "STYLE",
      tools: [
        { id: "cartoon", label: "Cartoon",        icon: <IconCartoon />, shortcut: "1", active: representation === "cartoon",        onClick: () => setRepresentation("cartoon") },
        { id: "surface", label: "Surface",        icon: <IconSurface />, shortcut: "2", active: representation === "surface",        onClick: () => setRepresentation("surface") },
        { id: "atoms",   label: "Ball-and-stick", icon: <IconAtoms />,   shortcut: "3", active: representation === "ball-and-stick", onClick: () => setRepresentation("ball-and-stick") },
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
        { id: "play",  label: playing ? "Pause" : "Play simulation", icon: playing ? <IconPause /> : <IconPlay />, shortcut: "Space", accent: true, onClick: () => { if (currentPerturb) setPlaying((p) => !p); else setDrawerOpen(true); } },
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
      {/* Edge-to-edge viewer with its own chrome suppressed */}
      <Suspense fallback={<div style={{ padding: 24, color: "var(--text-muted)" }}>loading viewer…</div>}>
        <MolstarViewer
          pdbId={tgt}
          representation={representation}
          colorTheme={COLOR_ORDER[colorThemeIdx]}
          hotspots={showHotspots ? round.hotspots : []}
          binderColor={accent}
          focusPocket={false}
          hideChrome
          accessibleDescription={`Fullscreen 3D view of ${tgt}. ${representation}, ${COLOR_ORDER[colorThemeIdx]}, hotspots ${showHotspots ? "on" : "off"}.`}
        />
      </Suspense>

      {/* Perturbation animation overlay */}
      <PerturbationEffect
        perturbation={currentPerturb}
        playing={playing}
        onComplete={onPerturbComplete}
      />

      {/* Compact top bar — bounded to the top 52px only */}
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

        {/* Live meta on the right */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
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
            aria-label="Current representation"
          >
            {representation}
          </span>
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
            aria-label="Current color theme"
          >
            {COLOR_ORDER[colorThemeIdx]}
          </span>
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

      {/* Floating tool palette — bounded between top bar (64) and bottom hint (64) */}
      <Toolbox groups={groups} visible={chromeVisible} />

      {/* Bottom playback bar appears only during or right after a perturbation */}
      {currentPerturb && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 16,
            padding: "10px 16px",
            background: "color-mix(in oklab, var(--bg-panel) 92%, transparent)",
            border: `1px solid ${playing ? accent : "var(--bg-line)"}`,
            borderRadius: 999,
            display: "flex",
            gap: 12,
            alignItems: "center",
            zIndex: 31,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            maxWidth: "min(720px, calc(100% - 32px))",
          }}
        >
          <button
            className="btn btn-primary"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
            style={{ padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <span style={{ fontSize: 16 }} aria-hidden="true">{currentPerturb.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div className="t-label" style={{ color: accent }}>
              {playing ? "PLAYING" : "PAUSED"} · {currentPerturb.compute.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentPerturb.name} — {currentPerturb.caption}
            </div>
          </div>
          <button
            className="btn"
            onClick={() => {
              setPlaying(false);
              setCurrentPerturb(null);
            }}
            aria-label="Clear perturbation"
            style={{ fontSize: 11 }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Apply-substance drawer */}
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

export function FullscreenViewerPage() {
  return (
    <ToastProvider>
      <FullscreenInner />
    </ToastProvider>
  );
}
