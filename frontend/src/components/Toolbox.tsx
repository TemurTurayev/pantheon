import type { ReactNode } from "react";

export interface ToolBtn {
  id: string;
  label: string;
  icon: ReactNode;
  shortcut?: string;
  accent?: boolean;
  active?: boolean;
  onClick: () => void;
}

export interface ToolGroup {
  id: string;
  label: string;
  tools: ToolBtn[];
  accent?: boolean;
}

interface Props {
  groups: ToolGroup[];
  visible: boolean;
}

// Floating tool-palette. Bounded to the safe area between the top bar
// (top: 64px) and the bottom (bottom: 64px). Scrolls internally if the
// groups exceed the viewport height.
export function Toolbox({ groups, visible }: Props) {
  return (
    <div
      role="toolbar"
      aria-label="Viewer tools"
      style={{
        position: "absolute",
        left: 12,
        top: 64,
        bottom: 64,
        width: 56,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingRight: 2,
        transform: `translateX(${visible ? 0 : -24}px)`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition:
          "transform 280ms var(--ease-standard), opacity 280ms var(--ease-standard)",
        zIndex: 20,
        scrollbarWidth: "none",
      }}
    >
      {groups.map((g) => (
        <div
          key={g.id}
          className="panel-raised"
          style={{
            padding: 5,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            borderColor: g.accent ? "var(--accent-amber)" : "var(--bg-line)",
            flexShrink: 0,
          }}
        >
          <span
            className="t-label"
            style={{
              fontSize: 8,
              padding: "2px 2px",
              textAlign: "center",
              color: g.accent ? "var(--accent-amber)" : "var(--text-dim)",
            }}
          >
            {g.label}
          </span>
          {g.tools.map((t) => (
            <button
              key={t.id}
              onClick={t.onClick}
              aria-label={`${t.label}${t.shortcut ? ` (shortcut ${t.shortcut})` : ""}`}
              aria-pressed={t.active}
              title={`${t.label}${t.shortcut ? `  ·  ${t.shortcut}` : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                padding: 0,
                borderRadius: 6,
                background: t.active ? "var(--bg-line)" : "transparent",
                border: "1px solid",
                borderColor: t.active
                  ? t.accent
                    ? "var(--accent-amber)"
                    : "var(--accent-cyan)"
                  : "transparent",
                color: t.accent ? "var(--accent-amber)" : "var(--text-primary)",
                cursor: "pointer",
                transition:
                  "background var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)",
              }}
              onMouseEnter={(e) => {
                if (!t.active) (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)";
              }}
              onMouseLeave={(e) => {
                if (!t.active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
