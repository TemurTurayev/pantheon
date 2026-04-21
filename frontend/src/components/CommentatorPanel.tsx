import { useEffect, useRef, useState } from "react";
import type { RoundLog } from "../types";

interface Props {
  round: RoundLog;
}

// Stub commentator. Real deployment plugs a non-participant LLM (e.g. Claude
// Haiku) with the system prompt in docs/COMMENTATOR.md; this component just
// renders the most recent event as play-by-play text.
export function CommentatorPanel({ round }: Props) {
  const [current, setCurrent] = useState("Welcome to PANTHEON — three frontier AIs are racing to design a binder for streptavidin.");
  const cursorRef = useRef(0);

  useEffect(() => {
    const events = round.events;
    if (events.length === 0) return;
    const timer = setInterval(() => {
      const ev = events[cursorRef.current % events.length];
      setCurrent(narrateEvent(ev.text, ev.severity));
      cursorRef.current += 1;
    }, 5500);
    return () => clearInterval(timer);
  }, [round.events]);

  return (
    <div
      className="panel"
      style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      role="region"
      aria-label="Commentator"
      aria-live="polite"
    >
      <div>
        <div className="t-label" style={{ marginBottom: 8, color: "var(--accent-amber)" }}>
          ARENA-CAST
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.5, color: "var(--text-primary)" }}>
          {current}
        </div>
      </div>
      <div className="t-meta" style={{ marginTop: 12 }}>
        Live commentary · stub narrator · real deployment swaps in a non-participant LLM
      </div>
    </div>
  );
}

function narrateEvent(text: string, severity?: string): string {
  if (severity === "milestone") return `Big moment — ${text.toLowerCase()}. The rest of the field has to respond.`;
  return text.replace(/^Round complete/i, "And that's the round");
}
