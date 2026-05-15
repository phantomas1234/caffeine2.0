# Caffeine 2.0

Resurrection of the [DD-DeCaF Caffeine platform](https://github.com/DD-DeCaF) as
a monolithic Next.js application backed by a small number of Python (Modal)
services for cobrapy/cameo workloads.

## Architecture

- **Next.js 15 + MUI v6** on Vercel — all UI + CRUD for projects, models, maps,
  designs, media, experiments, strains, measurements, mappings.
- **Neon Postgres** — single database, schema-separated, replaces the 6 service
  databases + Neo4j + Redis + RabbitMQ.
- **Cloudflare R2** — object storage for SBML, Escher map JSON, CSV uploads.
- **Auth.js** with Google — replaces the original `iam` service.
- **Modal** (Phase 3+) — `simulations`, `metabolic-ninja` (worker), and a
  `model-parser` sidecar for SBML validation.

## Repository layout

```
apps/web              Next.js application
packages/db           Drizzle schema, migrations, and client
services/             Modal Python services (added in later phases)
```

## Local development

```sh
cp .env.example .env.local
pnpm install
pnpm db:migrate
pnpm dev
```

The app runs on `http://localhost:4200/` — same port the original Caffeine UI
used.

## Phases

- **0** Foundation: monorepo, Next.js shell, MUI theme, Auth.js, Drizzle schema
  covering all domains, R2 client. *(in progress)*
- **1** Projects + Models with SBML upload via `model-parser`.
- **2** Maps + read-only Interactive Map (Escher).
- **3** Designs + `simulations` (FBA / yields).
- **4** Jobs + `metabolic-ninja` worker + email.
- **5** Warehouse: experiments, strains, media, samples.
- **6** Proteomics + fermentation CSV upload + charts.
- **7** Community modeling + id-mapper from restored dump.
- **8** Cutover, public seed data, retire tombstone.
