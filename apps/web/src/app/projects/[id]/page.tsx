"use client";

import { use, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import AddIcon from "@mui/icons-material/Add";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { UploadModelDialog } from "@/components/UploadModelDialog";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [uploadOpen, setUploadOpen] = useState(false);

  const project = useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.getProject(id),
  });

  const models = useQuery({
    queryKey: ["models", id],
    queryFn: () => api.listModels(id),
  });

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/projects">Projects</Link>
        <Typography color="text.primary">
          {project.data?.project.name ?? "…"}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}
      >
        <Box>
          <Typography variant="h4">
            {project.data?.project.name ??
              (project.isLoading ? <Skeleton width={240} /> : "Project")}
          </Typography>
          {project.data?.project.description ? (
            <Typography variant="body1" color="text.secondary">
              {project.data.project.description}
            </Typography>
          ) : null}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload model
        </Button>
      </Stack>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Models
      </Typography>

      {models.error ? (
        <Alert severity="error">{(models.error as Error).message}</Alert>
      ) : models.isLoading ? (
        <Stack spacing={2}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Stack>
      ) : models.data?.models.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              No models yet. Upload an SBML file to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {models.data?.models.map((m) => (
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
                    sx={{ alignItems: "center", justifyContent: "space-between" }}
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
                      {m.metadata?.metaboliteCount != null && (
                        <Chip
                          label={`${m.metadata.metaboliteCount} metabolites`}
                          size="small"
                        />
                      )}
                      {m.metadata?.geneCount != null && (
                        <Chip
                          label={`${m.metadata.geneCount} genes`}
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

      <UploadModelDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={id}
      />
    </Box>
  );
}
