import { useEffect, useState } from "react";
import { StructurePanel } from "./components/StructurePanel";
import { PlayerPanel } from "./components/PlayerPanel";
import { AffinityChart } from "./components/AffinityChart";
import { ToolTimeline } from "./components/ToolTimeline";
import { EventTicker } from "./components/EventTicker";
import type { RoundLog } from "./types";

const LAYOUT = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr",
  gridTemplateRows: "1.5fr 1fr 40px",
  gap: 8,
  padding: 8,
  width: "100%",
  height: "100%",
  boxSizing: "border-box" as const,
};

export function App() {
  const [round, setRound] = useState<RoundLog | null>(null);

  useEffect(() => {
    fetch("/round.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setRound)
      .catch(() => setRound(null));
  }, []);

  return (
    <div style={LAYOUT}>
      <StructurePanel round={round} />
      <PlayerPanel round={round} />
      <AffinityChart round={round} />
      <ToolTimeline round={round} />
      <EventTicker round={round} />
    </div>
  );
}
