import { useEffect, useRef } from "react";
import type { RoundLog } from "../types";

interface Props {
  round: RoundLog | null;
}

const PANEL: React.CSSProperties = {
  gridColumn: "1 / 2",
  gridRow: "1 / 3",
  background: "#111820",
  border: "1px solid #1e2a36",
  borderRadius: 8,
  position: "relative",
  overflow: "hidden",
};

export function StructurePanel({ round }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !round?.target_pdb) return;
    let destroy: (() => void) | null = null;
    (async () => {
      const { createPluginUI } = await import("molstar/lib/mol-plugin-ui");
      const { DefaultPluginUISpec } = await import("molstar/lib/mol-plugin-ui/spec");
      const { renderReact18 } = await import("molstar/lib/mol-plugin-ui/react18");
      const plugin = await createPluginUI({
        target: ref.current!,
        render: renderReact18,
        spec: DefaultPluginUISpec(),
      });
      const data = await plugin.builders.data.download(
        { url: `https://files.rcsb.org/download/${round.target_pdb}.pdb` },
        { state: { isGhost: true } }
      );
      const trajectory = await plugin.builders.structure.parseTrajectory(data, "pdb");
      await plugin.builders.structure.hierarchy.applyPreset(trajectory, "default");
      destroy = () => plugin.dispose();
    })();
    return () => {
      destroy?.();
    };
  }, [round?.target_pdb]);

  return (
    <div style={PANEL}>
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 12,
          zIndex: 2,
          fontSize: 12,
          letterSpacing: 1.2,
          color: "#6a7a8a",
        }}
      >
        TARGET · {round?.target_id ?? "waiting for round"}
      </div>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
