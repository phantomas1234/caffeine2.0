"use client";

import { use } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EscherMap } from "@/components/EscherMap";

export default function MapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["map", id],
    queryFn: () => api.getMap(id),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteMap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maps"] });
      router.push("/maps");
    },
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton width={300} height={48} />
        <Skeleton width="100%" height={600} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert severity="error">
        {(error as Error | undefined)?.message ?? "Map not found"}
      </Alert>
    );
  }

  const { map } = data;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/maps">Maps</Link>
        <Typography color="text.primary">{map.name}</Typography>
      </Breadcrumbs>

      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}
      >
        <Typography variant="h4">{map.name}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<OpenInFullIcon />}
            component={Link}
            href={`/interactive-map?map=${map.id}`}
          >
            Open in viewer
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={remove.isPending}
            onClick={() => {
              if (confirm(`Delete ${map.name}?`)) remove.mutate();
            }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      <EscherMap mapData={map.escher} readOnly height={600} />
    </Box>
  );
}
