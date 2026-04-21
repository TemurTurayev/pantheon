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

// Floating tool-palette, left edge, auto-hides with the cursor.
export function Toolbox({ groups, visible }: Props) {
  return (
    <div
      role="toolbar"
      aria-label="Viewer tools"
      style={{
        position: "absolute",
        left: 16,
        top: "50%",
        transform: `translate(${visible ? 0 : -24}px, -50%)`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition:
          "transform 280ms var(--ease-standard), opacity 280ms var(--ease-standard)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 20,
      }}
    >
      {groups.map((g) => (
        <div
          key={g.id}
          className="panel-raised"
          style={{
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            borderColor: g.accent ? "var(--accent-amber)" : "var(--bg-line)",
          }}
        >
          <span
            className="t-label"
            style={{
              fontSize: 9,
              padding: "2px 4px",
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
                gap: 8,
                width: 40,
                height: 40,
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
                justifyContent: "center",
                fontSize: 16,
                transition: "background var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)",
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
