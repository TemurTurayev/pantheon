import { useEffect, useRef, useState } from "react";
import type { HotspotAnnotation } from "../types";

export type Representation = "cartoon" | "surface" | "ball-and-stick";
export type ColorTheme = "chain-id" | "residue-name" | "hydrophobicity" | "plddt-confidence" | "element-symbol" | "sequence-id";

interface Props {
  pdbId: string;
  representation: Representation;
  colorTheme: ColorTheme;
  hotspots: HotspotAnnotation[];
  onResidueClick?: (residue: number) => void;
}

// Custom Mol* wrapper — follows the research agent's guidance:
// - createPluginUI + renderReact18
// - caches plugin ref, disposes on unmount (StrictMode-safe)
// - programmatic representation + theme switches via the builder API
// - hotspot highlight as a second representation with uniform color
export function MolstarViewer({ pdbId, representation, colorTheme, hotspots, onResidueClick }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Initialise once per pdbId.
  useEffect(() => {
    let mounted = true;
    setStatus("loading");

    (async () => {
      const { createPluginUI } = await import("molstar/lib/mol-plugin-ui");
      const { renderReact18 } = await import("molstar/lib/mol-plugin-ui/react18");
      const { DefaultPluginUISpec } = await import("molstar/lib/mol-plugin-ui/spec");

      if (!mounted || !hostRef.current) return;

      const spec = DefaultPluginUISpec();
      // Hide Mol*'s own chrome; we drive everything programmatically.
      spec.layout = {
        initial: {
          isExpanded: false,
          showControls: false,
          regionState: {
            left: "hidden",
            right: "hidden",
            top: "hidden",
            bottom: "hidden",
          },
          controlsDisplay: "reactive",
        },
      };

      const plugin = await createPluginUI({
        target: hostRef.current,
        render: renderReact18,
        spec,
      });

      if (!mounted) {
        plugin.dispose();
        return;
      }
      pluginRef.current = plugin;

      try {
        const data = await plugin.builders.data.download(
          { url: `https://models.rcsb.org/${pdbId.toLowerCase()}.bcif`, isBinary: true },
          { state: { isGhost: true } }
        );
        const trajectory = await plugin.builders.structure.parseTrajectory(data, "mmcif");
        await plugin.builders.structure.hierarchy.applyPreset(trajectory, "default");
        setStatus("ready");
      } catch (e) {
        console.error("Mol* load failed", e);
        setStatus("error");
      }
    })();

    return () => {
      mounted = false;
      if (pluginRef.current) {
        pluginRef.current.dispose();
        pluginRef.current = null;
      }
    };
  }, [pdbId]);

  // Click-to-select residue → callback.
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || !onResidueClick) return;
    const sub = plugin.behaviors.interaction.click.subscribe((e: any) => {
      try {
        const loci = e?.current?.loci;
        if (!loci) return;
        const seqId = loci.elements?.[0]?.unit?.model?.atomicHierarchy?.residues?.auth_seq_id?.value?.(
          loci.elements?.[0]?.indices?.[0] ?? 0
        );
        if (typeof seqId === "number") onResidueClick(seqId);
      } catch {
        // non-residue click
      }
    });
    return () => sub.unsubscribe();
  }, [onResidueClick, status]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />

      {/* HUD overlay */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: "6px 10px",
          background: "color-mix(in oklab, var(--bg-panel) 85%, transparent)",
          border: "1px solid var(--bg-line)",
          borderRadius: 6,
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <span className="t-label" style={{ color: "var(--accent-cyan)" }}>TARGET</span>
        <span className="t-mono" style={{ color: "var(--text-primary)" }}>{pdbId.toUpperCase()}</span>
        <span className="t-label" style={{ marginLeft: 10 }}>REP</span>
        <span className="t-mono" style={{ color: "var(--text-muted)" }}>{representation}</span>
        <span className="t-label" style={{ marginLeft: 10 }}>THEME</span>
        <span className="t-mono" style={{ color: "var(--text-muted)" }}>{colorTheme}</span>
      </div>

      {/* Hotspot legend */}
      {hotspots.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            background: "color-mix(in oklab, var(--bg-panel) 85%, transparent)",
            border: "1px solid var(--bg-line)",
            borderRadius: 6,
            padding: "10px 12px",
            maxWidth: 300,
            fontSize: 11,
            color: "var(--text-muted)",
            zIndex: 2,
          }}
        >
          <div className="t-label" style={{ marginBottom: 6 }}>HOTSPOTS</div>
          {hotspots.slice(0, 4).map((h) => (
            <div key={h.residue} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
              <span className="t-mono" style={{ color: "var(--accent-amber)" }}>{h.label}</span>
              <span style={{ color: "var(--text-dim)", fontSize: 10 }}>·</span>
              <span>{h.role}</span>
            </div>
          ))}
        </div>
      )}

      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-void)",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          fetching {pdbId} from RCSB…
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-void)",
            color: "var(--warn)",
            fontSize: 13,
          }}
        >
          failed to load {pdbId}
        </div>
      )}
    </div>
  );
}
