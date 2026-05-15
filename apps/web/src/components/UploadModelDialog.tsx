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
import Typography from "@mui/material/Typography";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

type Stage = "idle" | "presign" | "upload" | "parse" | "done";

export function UploadModelDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const queryClient = useQueryClient();

  const reset = () => {
    setName("");
    setDescription("");
    setFile(null);
    setStage("idle");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose an SBML file first");
      setStage("presign");
      const { url, key } = await api.getUploadUrl({
        filename: file.name,
        contentType: file.type || "application/xml",
      });

      setStage("upload");
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type || "application/xml" },
      });
      if (!uploadRes.ok) {
        throw new Error(`R2 upload failed: ${uploadRes.status}`);
      }

      setStage("parse");
      const { model } = await api.createModel({
        name: name || file.name,
        description: description || undefined,
        projectId,
        objectKey: key,
      });
      setStage("done");
      return model;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models", projectId] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
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
      <DialogTitle>Upload SBML model</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Button variant="outlined" component="label" disabled={mutation.isPending}>
            {file ? file.name : "Choose SBML file"}
            <input
              hidden
              type="file"
              accept=".xml,.sbml,application/xml,text/xml"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
                if (f && !name) setName(f.name.replace(/\.[^.]+$/, ""));
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
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            disabled={mutation.isPending}
          />
          {mutation.isPending ? (
            <Stack spacing={1}>
              <Typography variant="caption">
                {stage === "presign"
                  ? "Requesting upload URL…"
                  : stage === "upload"
                  ? "Uploading to storage…"
                  : stage === "parse"
                  ? "Validating SBML…"
                  : "Working…"}
              </Typography>
              <LinearProgress />
            </Stack>
          ) : null}
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
          onClick={() => mutation.mutate()}
          disabled={!file || mutation.isPending}
        >
          {mutation.isPending ? "Uploading…" : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
