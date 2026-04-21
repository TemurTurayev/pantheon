import type { PlayerState } from "../types";

interface Props {
  state: PlayerState;
}

const COLOR: Record<string, string> = {
  thinking: "var(--status-thinking)",
  tool: "var(--status-tool)",
  done: "var(--status-done)",
  error: "var(--status-error)",
};

const LABEL: Record<string, string> = {
  thinking: "thinking",
  tool: "tool",
  done: "done",
  error: "error",
};

export function StatusPill({ state }: Props) {
  const color = COLOR[state.status] ?? "var(--text-muted)";
  const label = state.status === "tool" && state.current_tool ? state.current_tool : LABEL[state.status];
  return (
    <span
      className="t-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 999,
        background: "color-mix(in oklab, " + color + " 12%, transparent)",
        color,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
        letterSpacing: 0.3,
        textTransform: "lowercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: state.status === "thinking" || state.status === "tool" ? `0 0 6px ${color}` : "none",
        }}
      />
      {label}
    </span>
  );
}
