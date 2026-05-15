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
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export default function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["model", id],
    queryFn: () => api.getModel(id),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      router.push("/models");
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 960 }}>
        <Skeleton width={300} height={48} />
        <Skeleton width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert severity="error">
        {(error as Error | undefined)?.message ?? "Model not found"}
      </Alert>
    );
  }

  const { model, downloadUrl } = data;
  const meta = model.metadata ?? {};

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/models">Models</Link>
        <Typography color="text.primary">{model.name}</Typography>
      </Breadcrumbs>

      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}
      >
        <Typography variant="h4">{model.name}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            component="a"
            href={downloadUrl}
          >
            Download SBML
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={remove.isPending}
            onClick={() => {
              if (confirm(`Delete ${model.name}?`)) remove.mutate();
            }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      {model.description ? (
        <Typography variant="body1" sx={{ mb: 3 }}>
          {model.description}
        </Typography>
      ) : null}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Model statistics
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
        >
          <Chip label={`${meta.reactionCount ?? "?"} reactions`} />
          <Chip label={`${meta.metaboliteCount ?? "?"} metabolites`} />
          <Chip label={`${meta.geneCount ?? "?"} genes`} />
          {meta.compartments?.map((c) => (
            <Chip key={c} label={c} variant="outlined" size="small" />
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          SBML object key: <code>{model.sbmlObjectKey}</code>
        </Typography>
      </Paper>
    </Box>
  );
}
