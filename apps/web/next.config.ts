import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // typedRoutes interacts poorly with MUI v9's polymorphic `component` prop;
  // re-enable once @mui/material@9 ships richer typings.
  typedRoutes: false,
};

export default config;
