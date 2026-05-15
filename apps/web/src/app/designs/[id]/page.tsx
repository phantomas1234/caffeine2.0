"use client";

import { use } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export default function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["design", id],
    queryFn: () => api.getDesign(id),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteDesign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs"] });
      router.push("/designs");
    },
  });

  const simulate = useMutation({
    mutationFn: () =>
      api.simulateFba({
        modelId: data!.design.modelId,
        design: data!.design.design,
      }),
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton width={300} height={48} />
        <Skeleton width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (error || !data) {
    return (
      <Alert severity="error">
        {(error as Error | undefined)?.message ?? "Design not found"}
      </Alert>
    );
  }
  const d = data.design;

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/designs">Designs</Link>
        <Typography color="text.primary">{d.name}</Typography>
      </Breadcrumbs>

      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}
      >
        <Typography variant="h4">{d.name}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={simulate.isPending}
            onClick={() => simulate.mutate()}
          >
            {simulate.isPending ? "Running…" : "Run FBA"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={remove.isPending}
            onClick={() => {
              if (confirm(`Delete ${d.name}?`)) remove.mutate();
            }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      {d.description ? (
        <Typography variant="body1" sx={{ mb: 3 }}>
          {d.description}
        </Typography>
      ) : null}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Reaction knockouts
        </Typography>
        {d.design.reactionKnockouts.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            none
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
            {d.design.reactionKnockouts.map((r) => (
              <Chip key={r} label={r} size="small" />
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Gene knockouts
        </Typography>
        {d.design.geneKnockouts.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            none
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
            {d.design.geneKnockouts.map((g) => (
              <Chip key={g} label={g} size="small" />
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Reaction bounds
        </Typography>
        {d.design.reactionBounds.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            none
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {d.design.reactionBounds.map((b) => (
              <Typography key={b.id} variant="body2">
                <code>{b.id}</code> → [{b.lower ?? "-∞"}, {b.upper ?? "∞"}]
              </Typography>
            ))}
          </Stack>
        )}
      </Paper>

      {simulate.error ? (
        <Alert severity="error">{(simulate.error as Error).message}</Alert>
      ) : null}
      {simulate.data ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Last FBA
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`status: ${simulate.data.result.status}`} />
            {simulate.data.result.growth_rate != null ? (
              <Chip
                color="success"
                label={`growth: ${simulate.data.result.growth_rate.toFixed(4)} h⁻¹`}
              />
            ) : null}
            <Chip
              variant="outlined"
              label={`${Object.keys(simulate.data.result.fluxes).length} fluxes`}
            />
          </Stack>
        </Paper>
      ) : null}
    </Box>
  );
}
