import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PerturbationDrawer, type Perturbation } from "../components/PerturbationDrawer";
import { ShortcutSheet } from "../components/ShortcutSheet";
import { ToastProvider, useToast } from "../components/ToastProvider";
import { Toolbox, type ToolGroup } from "../components/Toolbox";
import { useKeyboard } from "../hooks/useKeyboard";
import { useRound } from "../data/useRound";
import type { ColorTheme, Representation } from "../components/MolstarViewer";

const MolstarViewer = lazy(() =>
  import("../components/MolstarViewer").then((m) => ({ default: m.MolstarViewer }))
);

const COLOR_ORDER: ColorTheme[] = ["chain-id", "residue-name", "hydrophobicity", "plddt-confidence", "sequence-id", "element-symbol"];

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

  // Auto-hide logic — 2500ms idle per fullscreen-UX research.
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
      show(`${p.name} · ${p.caption}`, "info", p.duration_s * 1000);
      setTimeout(() => {
        setPlaying(false);
        show(`${p.name} complete`, "good", 2500);
      }, p.duration_s * 1000);
    },
    [show]
  );

  const cycleColor = useCallback(() => {
    setColorThemeIdx((i) => (i + 1) % COLOR_ORDER.length);
    show(`color: ${COLOR_ORDER[(colorThemeIdx + 1) % COLOR_ORDER.length]}`, "info", 1800);
  }, [colorThemeIdx, show]);

  const snapshot = useCallback(() => {
    // Stub — real impl would call plugin.canvas3d.getImagePass per the Mol* spec.
    show("snapshot copied to downloads (stub)", "good", 2500);
  }, [show]);

  useKeyboard({
    Escape: () => {
      if (shortcutOpen) setShortcutOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
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
        { id: "home",   label: "Home view",   icon: "⌂",  shortcut: "H", onClick: () => show("camera reset to home", "info", 1500) },
        { id: "zoom",   label: "Zoom to focus", icon: "⊕", shortcut: "Z", onClick: () => show("zoomed to hotspot pocket", "info", 1500) },
      ],
    },
    {
      id: "style",
      label: "STYLE",
      tools: [
        { id: "cartoon", label: "Cartoon",         icon: "〰", shortcut: "1", active: representation === "cartoon",         onClick: () => setRepresentation("cartoon") },
        { id: "surface", label: "Surface",         icon: "◉", shortcut: "2", active: representation === "surface",         onClick: () => setRepresentation("surface") },
        { id: "atoms",   label: "Ball-and-stick",  icon: "⚛", shortcut: "3", active: representation === "ball-and-stick",  onClick: () => setRepresentation("ball-and-stick") },
        { id: "color",   label: "Cycle color theme", icon: "✻", shortcut: "C", onClick: cycleColor },
        { id: "hot",     label: "Toggle hotspots", icon: "◈", shortcut: "T", active: showHotspots, onClick: () => setShowHotspots((v) => !v) },
      ],
    },
    {
      id: "analyze",
      label: "ANALYZE",
      tools: [
        { id: "ruler",  label: "Measure distance", icon: "⟷", shortcut: "M", onClick: () => show("measurement: drag between two atoms (stub)", "info", 2000) },
        { id: "select", label: "Select residue",   icon: "▭", shortcut: "S", onClick: () => show("click a residue to open scanner", "info", 2000) },
      ],
    },
    {
      id: "capture",
      label: "CAPTURE",
      tools: [
        { id: "snap", label: "Snapshot PNG", icon: "⌾", shortcut: "P", onClick: snapshot },
      ],
    },
    {
      id: "sim",
      label: "SIMULATE",
      accent: true,
      tools: [
        { id: "apply", label: "Apply substance", icon: "🧪", shortcut: "A", accent: true, onClick: () => setDrawerOpen(true) },
        { id: "play",  label: playing ? "Pause" : "Play simulation", icon: playing ? "⏸" : "▶", shortcut: "Space", accent: true, onClick: () => { if (currentPerturb) setPlaying((p) => !p); else setDrawerOpen(true); } },
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
      {/* Edge-to-edge viewer */}
      <Suspense fallback={<div style={{ padding: 24, color: "var(--text-muted)" }}>loading viewer…</div>}>
        <MolstarViewer
          pdbId={tgt}
          representation={representation}
          colorTheme={COLOR_ORDER[colorThemeIdx]}
          hotspots={showHotspots ? round.hotspots : []}
          binderColor={accent}
          focusPocket={false}
          accessibleDescription={`Fullscreen 3D view of ${tgt}. ${representation}, ${COLOR_ORDER[colorThemeIdx]}, hotspots ${showHotspots ? "on" : "off"}.`}
        />
      </Suspense>

      {/* Top bar — chromeless title + exit */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "linear-gradient(to bottom, color-mix(in oklab, var(--bg-void) 78%, transparent), transparent)",
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
          style={{ padding: "6px 12px", fontSize: 12 }}
        >
          ← Exit · F / Esc
        </button>
        <div style={{ flex: 1 }}>
          <div className="t-label" style={{ marginBottom: 2 }}>FULLSCREEN VIEWER</div>
          <div style={{ fontSize: 15, color: "var(--text-primary)" }}>
            target · <strong>{round.target_id}</strong> · PDB {tgt}
          </div>
        </div>
        <button
          className="btn"
          onClick={() => setShortcutOpen(true)}
          aria-label="Open keyboard shortcuts"
          style={{ fontSize: 12 }}
        >
          Shortcuts · ?
        </button>
      </div>

      {/* Floating tool palette */}
      <Toolbox groups={groups} visible={chromeVisible} />

      {/* Bottom playback bar — shown when a perturbation is running */}
      {currentPerturb && (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            padding: "10px 14px",
            background: "color-mix(in oklab, var(--bg-panel) 92%, transparent)",
            border: `1px solid ${accent}`,
            borderRadius: 8,
            display: "flex",
            gap: 16,
            alignItems: "center",
            zIndex: 20,
          }}
        >
          <span style={{ fontSize: 20 }} aria-hidden="true">{currentPerturb.icon}</span>
          <div style={{ flex: 1 }}>
            <div className="t-label" style={{ color: accent }}>
              PERTURBATION · {playing ? "PLAYING" : "PAUSED"}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{currentPerturb.caption}</div>
          </div>
          <span className="t-meta">duration {currentPerturb.duration_s}s · {currentPerturb.compute}</span>
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
