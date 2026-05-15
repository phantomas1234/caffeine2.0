import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

export default function Home() {
  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h3" gutterBottom>
        Caffeine
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Model-guided and data-driven design for industrial biotechnology.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is Caffeine 2.0 — a monolithic rebuild of the original platform.
          Sign in to access your projects, models, designs, and simulations.
        </Typography>
      </Paper>
    </Box>
  );
}
