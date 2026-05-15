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

export default function DesignsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["designs"],
    queryFn: () => api.listDesigns(),
  });

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Designs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Saved strain designs. Build new ones from the Interactive Map.
      </Typography>

      {error ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : isLoading ? (
        <Stack spacing={2}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      ) : data?.designs.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              No designs yet. Open the Interactive Map, build a design, and
              save it.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {data?.designs.map((d) => (
            <Link
              key={d.id}
              href={`/designs/${d.id}`}
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
                        <Typography variant="h6">{d.name}</Typography>
                        {d.description ? (
                          <Typography variant="body2" color="text.secondary">
                            {d.description}
                          </Typography>
                        ) : null}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {d.design.reactionKnockouts.length > 0 && (
                          <Chip
                            size="small"
                            label={`${d.design.reactionKnockouts.length} reaction ko`}
                          />
                        )}
                        {d.design.geneKnockouts.length > 0 && (
                          <Chip
                            size="small"
                            label={`${d.design.geneKnockouts.length} gene ko`}
                          />
                        )}
                        {d.design.reactionBounds.length > 0 && (
                          <Chip
                            size="small"
                            label={`${d.design.reactionBounds.length} bounds`}
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
