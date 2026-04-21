import { useEffect, useRef, useState, useTransition } from "react";
import type { RoundLog } from "../types";

interface Patch {
  path?: string;
  [key: string]: unknown;
}

// Streams round-state updates via SSE with dedupe + React 18 transitions.
// Falls back to the static /round.json snapshot if the SSE endpoint is offline.
export function useLiveRound(
  snapshotUrl: string = "/round.json",
  streamUrl: string | null = null
): { round: RoundLog | null; connected: boolean; isPending: boolean } {
  const [round, setRound] = useState<RoundLog | null>(null);
  const [connected, setConnected] = useState(false);
  const [isPending, startTransition] = useTransition();
  const seenIds = useRef<Set<string>>(new Set());

  // Load initial snapshot.
  useEffect(() => {
    let alive = true;
    fetch(snapshotUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => alive && setRound(data))
      .catch(() => alive && setRound(null));
    return () => {
      alive = false;
    };
  }, [snapshotUrl]);

  // Open SSE stream on top of the snapshot.
  useEffect(() => {
    if (!streamUrl) return;
    const es = new EventSource(streamUrl);
    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("error", () => setConnected(false));
    es.addEventListener("round.patch", (e) => {
      const ev = e as MessageEvent;
      if (ev.lastEventId && seenIds.current.has(ev.lastEventId)) return;
      if (ev.lastEventId) seenIds.current.add(ev.lastEventId);
      let patch: Patch;
      try {
        patch = JSON.parse(ev.data);
      } catch {
        return;
      }
      startTransition(() => {
        setRound((prev) => (prev ? applyPatch(prev, patch) : prev));
      });
    });
    return () => es.close();
  }, [streamUrl]);

  return { round, connected, isPending };
}

// Minimal immutable patcher. Callers send: {path: "players/<name>/status", value: "done"}
// or {path: "reasoning_by_player/<name>", append: {...entry}}. Anything shaped otherwise
// is ignored so we never corrupt the snapshot.
function applyPatch(prev: RoundLog, patch: Patch): RoundLog {
  if (!patch.path || typeof patch.path !== "string") return prev;
  const parts = patch.path.split("/").filter(Boolean);
  const next = { ...prev } as any;

  let cursor = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...cursor[key] };
    cursor = cursor[key];
  }
  const leaf = parts[parts.length - 1];
  if ("value" in patch) cursor[leaf] = patch.value;
  else if ("append" in patch && Array.isArray(cursor[leaf])) cursor[leaf] = [...cursor[leaf], patch.append];
  return next as RoundLog;
}
