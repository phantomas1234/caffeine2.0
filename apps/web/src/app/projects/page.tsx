"use client";

import { useState } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}
      >
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New project
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : isLoading ? (
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Stack>
      ) : data?.projects.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              No projects yet. Create one to start uploading models.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {data?.projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
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
                        <Typography variant="h6">{p.name}</Typography>
                        {p.description ? (
                          <Typography variant="body2" color="text.secondary">
                            {p.description}
                          </Typography>
                        ) : null}
                      </Box>
                      <Chip label={p.role} size="small" />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          ))}
        </Stack>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}
