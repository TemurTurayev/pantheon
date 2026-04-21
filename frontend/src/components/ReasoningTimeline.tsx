import { useEffect, useRef, useState } from "react";
import type { ReasoningEntry } from "../types";

interface Props {
  entries: ReasoningEntry[];
  color: string;
}

const KIND_COLOR: Record<ReasoningEntry["kind"], string> = {
  thought: "var(--status-thinking)",
  tool_call: "var(--status-tool)",
  tool_result: "var(--text-muted)",
  event: "var(--good)",
};

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function ReasoningTimeline({ entries, color }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom only if the user is already at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [entries.length, atBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 40);
  };

  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        className="t-label"
        style={{ padding: "10px 12px", borderBottom: "1px solid var(--bg-line)", display: "flex", alignItems: "center", gap: 8 }}
      >
        <div style={{ width: 3, height: 12, background: color, borderRadius: 2 }} />
        REASONING · {entries.length} events
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-atomic="false"
        style={{ overflowY: "auto", flex: 1, padding: "8px 12px", fontSize: 12 }}
      >
        {entries.length === 0 && (
          <div style={{ color: "var(--text-dim)", paddingTop: 12 }}>no events yet</div>
        )}
        {entries.map((e, i) => {
          const isExpanded = expanded.has(i);
          const hasBody = Boolean(e.body && e.body.length > 0);
          return (
            <div
              key={i}
              style={{
                borderLeft: `2px solid ${KIND_COLOR[e.kind]}`,
                paddingLeft: 10,
                marginBottom: 10,
                cursor: hasBody ? "pointer" : "default",
              }}
              onClick={() => hasBody && toggle(i)}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span className="t-mono" style={{ color: "var(--text-dim)", minWidth: 44, fontSize: 10 }}>
                  {formatTime(e.t_ms)}
                </span>
                <span className="t-label" style={{ color: KIND_COLOR[e.kind], minWidth: 72 }}>
                  {e.kind}
                </span>
                <span style={{ color: "var(--text-primary)", flex: 1 }}>
                  {e.tool ? <span className="t-mono" style={{ color: "var(--accent-amber)" }}>{e.tool} · </span> : null}
                  {e.summary}
                </span>
                {hasBody && (
                  <span style={{ color: "var(--text-dim)", fontSize: 10 }}>
                    {isExpanded ? "▾" : "▸"}
                  </span>
                )}
              </div>
              {hasBody && isExpanded && (
                <pre
                  className="t-mono"
                  style={{
                    margin: "6px 0 0 0",
                    padding: "8px 10px",
                    background: "var(--bg-void)",
                    border: "1px solid var(--bg-line)",
                    borderRadius: 4,
                    fontSize: 11,
                    color: "var(--text-muted)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {e.body}
                </pre>
              )}
            </div>
          );
        })}
      </div>

      {!atBottom && (
        <button
          className="btn btn-primary"
          onClick={() => setAtBottom(true)}
          style={{ position: "absolute", bottom: 16, right: 16, fontSize: 11 }}
        >
          Jump to live ↓
        </button>
      )}
    </div>
  );
}
