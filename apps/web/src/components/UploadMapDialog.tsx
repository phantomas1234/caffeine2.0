"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MenuItem from "@mui/material/MenuItem";
import { api } from "@/lib/api-client";

export function UploadMapDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const [name, setName] = useState("");
  const [modelId, setModelId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const models = useQuery({
    queryKey: ["models", projectId],
    queryFn: () => api.listModels(projectId),
    enabled: open,
  });

  const reset = () => {
    setName("");
    setModelId("");
    setFile(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose an Escher map JSON file");
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON");
      }
      return api.createMap({
        name: name || file.name.replace(/\.json$/i, ""),
        projectId,
        modelId: modelId || undefined,
        escher: parsed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maps"] });
      queryClient.invalidateQueries({ queryKey: ["maps", projectId] });
      reset();
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!mutation.isPending) {
          reset();
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Upload Escher map</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            component="label"
            disabled={mutation.isPending}
          >
            {file ? file.name : "Choose map JSON"}
            <input
              hidden
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
                if (f && !name) {
                  setName(f.name.replace(/\.json$/i, ""));
                }
              }}
            />
          </Button>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            disabled={mutation.isPending}
          />
          <TextField
            label="Associated model (optional)"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            select
            fullWidth
            disabled={mutation.isPending || models.isLoading}
          >
            <MenuItem value="">— none —</MenuItem>
            {models.data?.models.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>
          {mutation.isPending ? <LinearProgress /> : null}
          {mutation.error ? (
            <Alert severity="error">{(mutation.error as Error).message}</Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!file || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Uploading…" : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
