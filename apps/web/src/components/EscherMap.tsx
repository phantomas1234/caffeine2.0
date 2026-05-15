"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

export type EscherMapData = unknown;

type EscherBuilder = {
  options?: Record<string, unknown>;
  // The Builder mutates the passed selection's DOM; no formal teardown API
  // beyond removing the children, which we do on unmount.
};

type EscherModule = {
  Builder: new (
    map: EscherMapData,
    model: unknown,
    embeddedCss: string | null,
    selection: unknown,
    options: Record<string, unknown>,
  ) => EscherBuilder;
};

export type EscherMapProps = {
  /** The Escher map JSON (the full export, typically an array). */
  mapData: EscherMapData;
  /** Optional cobra-format model JSON for tooltips/validation. */
  modelData?: unknown;
  /** Disable editing toolbar etc. for a read-only viewer. */
  readOnly?: boolean;
  /** Reaction id → number (e.g. flux). Forwarded to Escher's reaction_data. */
  reactionData?: Record<string, number>;
  /** Height of the rendered map; defaults to 600 px. */
  height?: number | string;
};

export function EscherMap({
  mapData,
  modelData,
  readOnly = false,
  reactionData,
  height = 600,
}: EscherMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    let container = containerRef.current;
    if (!container) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [{ select }, escher] = await Promise.all([
          import("d3-selection"),
          import("escher") as Promise<EscherModule>,
        ]);
        if (disposed || !container) return;

        // Clean any prior render.
        container.innerHTML = "";
        const selection = select(container);

        const options: Record<string, unknown> = {
          fill_screen: true,
          never_ask_before_quit: true,
          menu: readOnly ? "none" : "all",
          enable_editing: !readOnly,
          enable_keys: !readOnly,
          enable_search: !readOnly,
          enable_tooltips: ["label"],
          reaction_data: reactionData ?? null,
        };

        new escher.Builder(
          mapData,
          modelData ?? null,
          null,
          selection,
          options,
        );
        setLoading(false);
      } catch (e) {
        if (!disposed) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
      if (container) container.innerHTML = "";
    };
  }, [mapData, modelData, readOnly, reactionData]);

  return (
    <Box sx={{ position: "relative", width: "100%", height }}>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: "100%",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
          // Escher emits absolutely-positioned children; give them a frame.
          position: "relative",
        }}
      />
      {loading ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            opacity: 0.85,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ position: "absolute", top: 8, left: 8, right: 8 }}>
          Failed to render map: {error}
        </Alert>
      ) : null}
    </Box>
  );
}
