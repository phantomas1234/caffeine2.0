"use client";

import { Roboto } from "next/font/google";
import { createTheme } from "@mui/material/styles";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#5d4037" },
    secondary: { main: "#00897b" },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  shape: { borderRadius: 8 },
});
