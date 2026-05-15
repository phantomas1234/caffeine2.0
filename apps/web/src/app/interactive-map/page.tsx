"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { EscherMap } from "@/components/EscherMap";

function InteractiveMapInner() {
  const params = useSearchParams();
  const router = useRouter();
  const urlMapId = params.get("map") ?? "";
  const [mapId, setMapId] = useState(urlMapId);

  const maps = useQuery({
    queryKey: ["maps"],
    queryFn: () => api.listMaps(),
  });

  const map = useQuery({
    queryKey: ["map", mapId],
    queryFn: () => api.getMap(mapId),
    enabled: !!mapId,
  });

  const handleChange = (id: string) => {
    setMapId(id);
    const next = new URLSearchParams(params.toString());
    if (id) next.set("map", id);
    else next.delete("map");
    router.replace(`/interactive-map?${next.toString()}`);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Interactive Map
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Read-only Escher viewer. Editing and design overlays land in Phase 3.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center" }}
        >
          <TextField
            label="Map"
            value={mapId}
            onChange={(e) => handleChange(e.target.value)}
            select
            sx={{ minWidth: 320 }}
            disabled={maps.isLoading}
          >
            <MenuItem value="">— pick a map —</MenuItem>
            {maps.data?.maps.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {!mapId ? (
        <Alert severity="info">
          Pick a map from the dropdown to render it.
        </Alert>
      ) : map.isLoading ? (
        <Skeleton width="100%" height={600} variant="rounded" />
      ) : map.error ? (
        <Alert severity="error">{(map.error as Error).message}</Alert>
      ) : map.data ? (
        <EscherMap mapData={map.data.map.escher} readOnly height={680} />
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
