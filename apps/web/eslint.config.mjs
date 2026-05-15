// Minimal flat config — keeps linting opt-in while ecosystem (Next 16 +
// ESLint 10 + eslint-config-next) settles. Per-phase we'll add stricter rules.
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];
