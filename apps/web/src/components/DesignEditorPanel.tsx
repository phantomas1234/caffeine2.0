"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useDesignEditor } from "@/stores/design-editor";

export function DesignEditorPanel() {
  const design = useDesignEditor((s) => s.design);
  const toggleRxn = useDesignEditor((s) => s.toggleReactionKnockout);
  const toggleGene = useDesignEditor((s) => s.toggleGeneKnockout);
  const setBound = useDesignEditor((s) => s.setReactionBound);
  const setMedium = useDesignEditor((s) => s.setMediumExchange);

  const [rxnInput, setRxnInput] = useState("");
  const [geneInput, setGeneInput] = useState("");
  const [boundId, setBoundId] = useState("");
  const [boundLower, setBoundLower] = useState("");
  const [boundUpper, setBoundUpper] = useState("");
  const [mediumId, setMediumId] = useState("");
  const [mediumLower, setMediumLower] = useState("");

  const addRxn = () => {
    if (rxnInput.trim()) {
      toggleRxn(rxnInput.trim());
      setRxnInput("");
    }
  };
  const addGene = () => {
    if (geneInput.trim()) {
      toggleGene(geneInput.trim());
      setGeneInput("");
    }
  };
  const addBound = () => {
    if (!boundId.trim()) return;
    const lower = boundLower !== "" ? Number(boundLower) : undefined;
    const upper = boundUpper !== "" ? Number(boundUpper) : undefined;
    if (lower === undefined && upper === undefined) return;
    setBound(boundId.trim(), { lower, upper });
    setBoundId("");
    setBoundLower("");
    setBoundUpper("");
  };
  const addMedium = () => {
    if (!mediumId.trim() || mediumLower === "") return;
    setMedium(mediumId.trim(), { lower: Number(mediumLower) });
    setMediumId("");
    setMediumLower("");
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Design
      </Typography>

      <Section title="Reaction knockouts">
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="e.g. PFK"
            value={rxnInput}
            onChange={(e) => setRxnInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRxn()}
          />
          <IconButton size="small" onClick={addRxn}>
            <AddIcon />
          </IconButton>
        </Stack>
        <ChipRow
          items={design.reactionKnockouts}
          onDelete={(id) => toggleRxn(id)}
        />
      </Section>

      <Section title="Gene knockouts">
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="e.g. b1234"
            value={geneInput}
            onChange={(e) => setGeneInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGene()}
          />
          <IconButton size="small" onClick={addGene}>
            <AddIcon />
          </IconButton>
        </Stack>
        <ChipRow
          items={design.geneKnockouts}
          onDelete={(id) => toggleGene(id)}
        />
      </Section>

      <Section title="Reaction bounds">
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="reaction id"
            value={boundId}
            onChange={(e) => setBoundId(e.target.value)}
          />
          <TextField
            size="small"
            type="number"
            placeholder="lower"
            value={boundLower}
            onChange={(e) => setBoundLower(e.target.value)}
            sx={{ width: 100 }}
          />
          <TextField
            size="small"
            type="number"
            placeholder="upper"
            value={boundUpper}
            onChange={(e) => setBoundUpper(e.target.value)}
            sx={{ width: 100 }}
          />
          <IconButton size="small" onClick={addBound}>
            <AddIcon />
          </IconButton>
        </Stack>
        <Stack spacing={0.5}>
          {design.reactionBounds.map((b) => (
            <Stack key={b.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip
                size="small"
                label={`${b.id}: [${b.lower ?? "-∞"}, ${b.upper ?? "∞"}]`}
              />
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  onClick={() => setBound(b.id, null)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      </Section>

      <Section title="Medium exchanges">
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Lower bound on exchange reactions (negative = uptake).
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="e.g. EX_glc__D_e"
            value={mediumId}
            onChange={(e) => setMediumId(e.target.value)}
          />
          <TextField
            size="small"
            type="number"
            placeholder="lower (e.g. -10)"
            value={mediumLower}
            onChange={(e) => setMediumLower(e.target.value)}
            sx={{ width: 140 }}
          />
          <IconButton size="small" onClick={addMedium}>
            <AddIcon />
          </IconButton>
        </Stack>
        <Stack spacing={0.5}>
          {design.mediumExchanges.map((m) => (
            <Stack key={m.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip size="small" label={`${m.id}: lower=${m.lower}`} />
              <IconButton
                size="small"
                onClick={() => setMedium(m.id, null)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Section>
    </Paper>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ChipRow({
  items,
  onDelete,
}: {
  items: string[];
  onDelete: (id: string) => void;
}) {
  if (items.length === 0)
    return (
      <Typography variant="caption" color="text.secondary">
        none
      </Typography>
    );
  return (
    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
      {items.map((id) => (
        <Chip key={id} size="small" label={id} onDelete={() => onDelete(id)} />
      ))}
    </Stack>
  );
}

export function SaveDesignButton({
  projectId,
  modelId,
  onSaved,
}: {
  projectId: string;
  modelId: string;
  onSaved?: () => void;
}) {
  const design = useDesignEditor((s) => s.design);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Save design
      </Button>
    );
  }

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { api } = await import("@/lib/api-client");
      await api.createDesign({ name: name.trim(), projectId, modelId, design });
      setOpen(false);
      setName("");
      onSaved?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <TextField
        size="small"
        placeholder="Design name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <Button variant="contained" disabled={!name || saving} onClick={save}>
        {saving ? "Saving…" : "Save"}
      </Button>
      <Button onClick={() => setOpen(false)}>Cancel</Button>
      {error ? (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      ) : null}
    </Stack>
  );
}
