import { useEffect, useRef, useState } from "react";
import type { HotspotAnnotation } from "../types";

export type Representation = "cartoon" | "surface" | "ball-and-stick";
export type ColorTheme = "chain-id" | "residue-name" | "hydrophobicity" | "plddt-confidence" | "element-symbol" | "sequence-id";

interface Props {
  pdbId: string;
  representation: Representation;
  colorTheme: ColorTheme;
  hotspots: HotspotAnnotation[];
  binderPdb?: string | null;     // optional in-memory binder structure
  binderColor?: string;           // accent hex for the binder
  focusPocket?: boolean;          // camera pre-set to hotspot pocket
  hideChrome?: boolean;           // suppress built-in HUD + hotspot legend
  accessibleDescription?: string; // sr-only description
  onResidueClick?: (residue: number) => void;
}

// Custom Mol* wrapper.
//
// Design: (a) build a single plugin once per pdbId; (b) keep it across re-renders;
// (c) mutate reps and camera only — never rebuild the plugin for a prop change;
// (d) expose an accessible description alongside the opaque canvas.
export function MolstarViewer({
  pdbId,
  representation,
  colorTheme,
  hotspots,
  binderPdb = null,
  binderColor = "#5ccfe6",
  focusPocket = true,
  hideChrome = false,
  accessibleDescription,
  onResidueClick,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<any>(null);
  const structureRef = useRef<any>(null);
  const hotspotSelRef = useRef<any>(null);
  const binderRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Initialise plugin + load target once per pdbId.
  useEffect(() => {
    let mounted = true;
    setStatus("loading");

    (async () => {
      const { createPluginUI } = await import("molstar/lib/mol-plugin-ui");
      const { renderReact18 } = await import("molstar/lib/mol-plugin-ui/react18");
      const { DefaultPluginUISpec } = await import("molstar/lib/mol-plugin-ui/spec");

      if (!mounted || !hostRef.current) return;

      const spec = DefaultPluginUISpec();
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
        const preset = await plugin.builders.structure.hierarchy.applyPreset(trajectory, "default");
        structureRef.current = preset?.structure ?? null;
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
      structureRef.current = null;
      hotspotSelRef.current = null;
      binderRef.current = null;
    };
  }, [pdbId]);

  // Hotspot overlay — render as ball-and-stick in amber on the target.
  useEffect(() => {
    if (status !== "ready") return;
    const plugin = pluginRef.current;
    const structure = structureRef.current;
    if (!plugin || !structure || hotspots.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const { MolScriptBuilder: MS } = await import("molstar/lib/mol-script/language/builder");
        const { Color } = await import("molstar/lib/mol-util/color");

        const expr = MS.struct.generator.atomGroups({
          "residue-test": MS.core.set.has([
            MS.set(...hotspots.map((h) => h.residue)),
            MS.ammp("auth_seq_id"),
          ]),
        });

        // Clear previous hotspot selection, if any.
        if (hotspotSelRef.current && hotspotSelRef.current.cell) {
          await plugin.build().delete(hotspotSelRef.current.cell).commit();
        }

        const sel = await plugin.builders.structure.tryCreateComponentFromExpression(
          structure,
          expr,
          "hotspots"
        );
        if (cancelled || !sel) return;
        hotspotSelRef.current = { cell: sel.cell ?? sel.ref ?? sel };

        await plugin.builders.structure.representation.addRepresentation(sel, {
          type: "ball-and-stick",
          color: "uniform",
          colorParams: { value: Color(0xffb547) },
        });

        if (focusPocket) {
          const { StructureSelection } = await import("molstar/lib/mol-model/structure/query");
          const { StructureQueryHelper } = await import(
            "molstar/lib/mol-plugin-state/helpers/structure-query"
          );
          try {
            const queried = StructureQueryHelper.createAndRun(structure.data ?? structure, expr);
            const loci = StructureSelection.toLociWithSourceUnits(queried.selection);
            plugin.managers.camera.focusLoci(loci, { extraRadius: 6, durationMs: 800 });
          } catch (err) {
            // Non-fatal — just skip the auto-focus.
            console.debug("focusLoci skipped", err);
          }
        }
      } catch (err) {
        console.debug("hotspot overlay skipped", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hotspots, status, focusPocket]);

  // Binder overlay — render from raw PDB string in the player's accent color.
  useEffect(() => {
    if (status !== "ready" || !binderPdb) return;
    const plugin = pluginRef.current;
    if (!plugin) return;

    let cancelled = false;
    (async () => {
      try {
        const { Color } = await import("molstar/lib/mol-util/color");

        // Clean up a previous binder before adding a new one.
        if (binderRef.current && binderRef.current.cell) {
          await plugin.build().delete(binderRef.current.cell).commit();
        }

        const raw = await plugin.builders.data.rawData({
          data: binderPdb,
          label: "binder-candidate",
        });
        const traj = await plugin.builders.structure.parseTrajectory(raw, "pdb");
        const model = await plugin.builders.structure.createModel(traj);
        const struct = await plugin.builders.structure.createStructure(model);
        if (cancelled) return;
        binderRef.current = { cell: struct.cell ?? struct.ref ?? struct };

        await plugin.builders.structure.representation.addRepresentation(struct, {
          type: "cartoon",
          color: "uniform",
          colorParams: { value: Color(parseInt(binderColor.replace("#", "0x"), 16)) },
        });
      } catch (err) {
        console.debug("binder overlay skipped", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [binderPdb, binderColor, status]);

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

  const autoDescription =
    accessibleDescription ||
    `3D rendering of protein ${pdbId.toUpperCase()}, shown as ${representation}, colored by ${colorTheme}. ${
      hotspots.length
    } hotspot residue${hotspots.length === 1 ? "" : "s"} highlighted${
      binderPdb ? ", with a candidate binder superposed" : ""
    }.`;

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      role="img"
      aria-label={`Molecular structure: ${pdbId.toUpperCase()}`}
      aria-describedby="mol-desc"
    >
      <div id="mol-desc" className="sr-only" aria-live="polite">
        {autoDescription}
      </div>

      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />

      {/* HUD overlay — suppressed in fullscreen (host owns its own chrome) */}
      {!hideChrome && <div
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
        {binderPdb && (
          <>
            <span className="t-label" style={{ marginLeft: 10, color: binderColor }}>BINDER</span>
            <span className="t-mono" style={{ color: "var(--text-muted)" }}>candidate</span>
          </>
        )}
      </div>}

      {/* Hotspot legend — also suppressed in fullscreen */}
      {!hideChrome && hotspots.length > 0 && (
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
          <div className="t-label" style={{ marginBottom: 6 }}>HOTSPOTS · amber spheres in 3D</div>
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
