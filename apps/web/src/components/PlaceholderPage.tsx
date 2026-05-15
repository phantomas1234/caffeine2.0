import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

export function PlaceholderPage({
  title,
  phase,
  description,
}: {
  title: string;
  phase: number;
  description: string;
}) {
  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="h4">{title}</Typography>
        <Chip label={`Phase ${phase}`} size="small" color="secondary" />
      </Box>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
