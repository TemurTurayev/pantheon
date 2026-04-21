interface Shortcut {
  keys: string;
  label: string;
}

interface Section {
  title: string;
  shortcuts: Shortcut[];
}

const SECTIONS: Section[] = [
  {
    title: "View",
    shortcuts: [
      { keys: "F",     label: "Toggle fullscreen" },
      { keys: "Esc",   label: "Exit / close" },
      { keys: "H",     label: "Home view / reset camera" },
      { keys: "Z",     label: "Zoom to focus" },
      { keys: "R",     label: "Reset rotation" },
    ],
  },
  {
    title: "Style",
    shortcuts: [
      { keys: "1",     label: "Cartoon representation" },
      { keys: "2",     label: "Surface representation" },
      { keys: "3",     label: "Ball-and-stick (atoms)" },
      { keys: "4",     label: "Spacefill" },
      { keys: "C",     label: "Cycle color themes" },
      { keys: "T",     label: "Toggle hotspots" },
    ],
  },
  {
    title: "Simulate",
    shortcuts: [
      { keys: "A",     label: "Apply substance / open drawer" },
      { keys: "Space", label: "Play / pause simulation" },
      { keys: "[  ]",  label: "Step one frame back / forward" },
    ],
  },
  {
    title: "Capture",
    shortcuts: [
      { keys: "P",     label: "Snapshot PNG" },
      { keys: "⇧ R",   label: "Record video (toggle)" },
    ],
  },
  {
    title: "Help",
    shortcuts: [
      { keys: "?",     label: "Show this cheat sheet" },
      { keys: "⌘ K",   label: "Command palette" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutSheet({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        animation: "fade-in 200ms var(--ease-standard)",
      }}
    >
      <div
        className="panel-raised"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(600px, calc(100% - 48px))",
          maxHeight: "calc(100% - 48px)",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <div className="t-label" style={{ color: "var(--accent-cyan)" }}>KEYBOARD</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Shortcuts</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts"
            className="btn"
            style={{ fontSize: 12 }}
          >
            Close · Esc
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {SECTIONS.map((sec) => (
            <section key={sec.title} aria-label={sec.title}>
              <div className="t-label" style={{ marginBottom: 8 }}>{sec.title}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {sec.shortcuts.map((s) => (
                  <li key={s.keys} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
                    <kbd
                      className="t-mono"
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        background: "var(--bg-void)",
                        border: "1px solid var(--bg-line)",
                        borderRadius: 4,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
