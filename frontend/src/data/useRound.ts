import { useEffect, useState } from "react";
import type { RoundLog } from "../types";

export function useRound(url: string = "/round.json"): RoundLog | null {
  const [round, setRound] = useState<RoundLog | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive) setRound(data);
      })
      .catch(() => alive && setRound(null));
    return () => {
      alive = false;
    };
  }, [url]);
  return round;
}
