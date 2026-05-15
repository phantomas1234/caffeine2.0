"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export default function ModelsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["models"],
    queryFn: () => api.listModels(),
  });

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Models
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Every metabolic model across your projects. Upload new models from a
        project page.
      </Typography>

      {error ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : isLoading ? (
        <Stack spacing={2}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Stack>
      ) : data?.models.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              No models yet. Open a project and upload an SBML file.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {data?.models.map((m) => (
            <Link
              key={m.id}
              href={`/models/${m.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card variant="outlined">
                <CardActionArea>
                  <CardContent>
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography variant="h6">{m.name}</Typography>
                        {m.description ? (
                          <Typography variant="body2" color="text.secondary">
                            {m.description}
                          </Typography>
                        ) : null}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {m.metadata?.reactionCount != null && (
                          <Chip
                            label={`${m.metadata.reactionCount} reactions`}
                            size="small"
                          />
                        )}
                      </Stack>
                    </Stack>
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
