"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { EscherMap } from "@/components/EscherMap";
import {
  DesignEditorPanel,
  SaveDesignButton,
} from "@/components/DesignEditorPanel";
import { useDesignEditor } from "@/stores/design-editor";

function InteractiveMapInner() {
  const params = useSearchParams();
  const router = useRouter();
  const urlMapId = params.get("map") ?? "";
  const urlModelId = params.get("model") ?? "";

  const [mapId, setMapId] = useState(urlMapId);
  const [modelId, setModelIdLocal] = useState(urlModelId);
  const setModelInStore = useDesignEditor((s) => s.setModel);
  const reset = useDesignEditor((s) => s.reset);
  const currentDesign = useDesignEditor((s) => s.design);

  const maps = useQuery({
    queryKey: ["maps"],
    queryFn: () => api.listMaps(),
  });
  const models = useQuery({
    queryKey: ["models"],
    queryFn: () => api.listModels(),
  });
  const map = useQuery({
    queryKey: ["map", mapId],
    queryFn: () => api.getMap(mapId),
    enabled: !!mapId,
  });

  useEffect(() => {
    setModelInStore(modelId || null);
  }, [modelId, setModelInStore]);

  // If the selected map links to a model, prefer that as the default.
  useEffect(() => {
    if (map.data?.map.modelId && !modelId) {
      setModelIdLocal(map.data.map.modelId);
    }
  }, [map.data?.map.modelId, modelId]);

  const updateUrl = (next: { map?: string; model?: string }) => {
    const params = new URLSearchParams();
    const m = next.map ?? mapId;
    const mo = next.model ?? modelId;
    if (m) params.set("map", m);
    if (mo) params.set("model", mo);
    const qs = params.toString();
    router.replace(`/interactive-map${qs ? `?${qs}` : ""}`);
  };

  const handleMapChange = (id: string) => {
    setMapId(id);
    reset();
    updateUrl({ map: id, model: "" });
    setModelIdLocal("");
  };

  const handleModelChange = (id: string) => {
    setModelIdLocal(id);
    updateUrl({ model: id });
  };

  const projectId =
    map.data?.map.projectId ??
    models.data?.models.find((m) => m.id === modelId)?.projectId ??
    null;

  const simulation = useMutation({
    mutationFn: () =>
      api.simulateFba({ modelId, design: currentDesign }),
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Interactive Map
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Pick a map and an associated model, edit a design, and run FBA.
        Fluxes paint onto the map.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
          useFlexGap
        >
          <TextField
            label="Map"
            value={mapId}
            onChange={(e) => handleMapChange(e.target.value)}
            select
            size="small"
            sx={{ minWidth: 240 }}
            disabled={maps.isLoading}
          >
            <MenuItem value="">— pick a map —</MenuItem>
            {maps.data?.maps.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Model"
            value={modelId}
            onChange={(e) => handleModelChange(e.target.value)}
            select
            size="small"
            sx={{ minWidth: 240 }}
            disabled={models.isLoading}
          >
            <MenuItem value="">— pick a model —</MenuItem>
            {models.data?.models.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={!modelId || simulation.isPending}
            onClick={() => simulation.mutate()}
          >
            {simulation.isPending ? "Running…" : "Run FBA"}
          </Button>
          {projectId && modelId ? (
            <SaveDesignButton projectId={projectId} modelId={modelId} />
          ) : null}
        </Stack>
        {simulation.isPending ? <LinearProgress sx={{ mt: 1 }} /> : null}
        {simulation.error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(simulation.error as Error).message}
          </Alert>
        ) : null}
        {simulation.data ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 2, alignItems: "center" }}
          >
            <Chip
              color="success"
              label={`status: ${simulation.data.result.status}`}
              size="small"
            />
            {simulation.data.result.growth_rate != null ? (
              <Chip
                label={`growth: ${simulation.data.result.growth_rate.toFixed(4)} h⁻¹`}
                size="small"
              />
            ) : null}
            <Chip
              variant="outlined"
              label={`${Object.keys(simulation.data.result.fluxes).length} fluxes`}
              size="small"
            />
          </Stack>
        ) : null}
      </Paper>

      {!mapId ? (
        <Alert severity="info">Pick a map to render it.</Alert>
      ) : map.isLoading ? (
        <Skeleton width="100%" height={600} variant="rounded" />
      ) : map.error ? (
        <Alert severity="error">{(map.error as Error).message}</Alert>
      ) : map.data ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <EscherMap
              mapData={map.data.map.escher}
              readOnly
              height={680}
              reactionData={simulation.data?.result.fluxes}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DesignEditorPanel />
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}

export default function InteractiveMapPage() {
  return (
    <Suspense fallback={<Skeleton width="100%" height={600} />}>
      <InteractiveMapInner />
    </Suspense>
  );
}
