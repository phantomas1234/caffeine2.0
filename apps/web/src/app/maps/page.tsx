"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export default function MapsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["maps"],
    queryFn: () => api.listMaps(),
  });

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Maps
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Escher pathway maps across your projects. Upload new maps from a
        project page.
      </Typography>

      {error ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : isLoading ? (
        <Stack spacing={2}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      ) : data?.maps.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              No maps yet. Open a project and upload an Escher JSON file.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {data?.maps.map((m) => (
            <Link
              key={m.id}
              href={`/maps/${m.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card variant="outlined">
                <CardActionArea>
                  <CardContent>
                    <Typography variant="h6">{m.name}</Typography>
                    {m.modelId ? (
                      <Typography variant="caption" color="text.secondary">
                        Linked model: {m.modelId.slice(0, 8)}…
                      </Typography>
                    ) : null}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          ))}
        </Stack>
      )}
    </Box>
  );
}
