# Caffeine 2.0 — context for Claude Code

> This file is the handoff from the cloud session that scaffolded the
> project. It exists so a fresh local Claude Code session can pick up
> the work without re-deriving the architecture from the diff. Keep it
> updated as you finish phases or change direction.

## What this project is

A monolithic resurrection of the [DD-DeCaF Caffeine
platform](https://github.com/DD-DeCaF). The original was a SaaS for data-
and model-driven strain engineering built between 2016–2019 on GKE as a
fleet of Flask microservices and a Vue 2 frontend. It reached end-of-life
around August 2023 when Google deprecated APIs the deployment relied on.
~75 monthly users at peak. All source is Apache-2.0; the caretaker
(Niko Sonnenschein, `phantomas1234`) is the user of this codebase.

We are **not** porting the Vue codebase. We are rebuilding the same
product as a Next.js monolith on Vercel, keeping only the Python-heavy
simulation code as separate services on Modal.

## Recovered architecture of the original

| Service              | Lang   | Backing store             | Purpose                                              |
|----------------------|--------|---------------------------|------------------------------------------------------|
| caffeine-vue         | Vue 2  | —                         | Frontend (Vuetify 1, Vuex, Firebase auth, Escher)    |
| iam                  | Flask  | Postgres                  | Users, RSA-signed JWT keypair shared with all svcs   |
| model-storage        | Flask  | Postgres + cobrapy        | SBML CRUD; validates on upload                       |
| map-storage          | Flask  | Postgres                  | Escher map JSON CRUD                                 |
| design-storage       | Flask  | Postgres                  | Saved strain designs                                 |
| warehouse            | Flask  | Postgres                  | Experiments, strains, media, omics measurements      |
| simulations          | Flask  | Redis cache               | FBA, FVA, yields (cobrapy + cameo)                   |
| metabolic-ninja      | Flask  | Postgres + RabbitMQ       | Async pathway prediction (cameo)                     |
| metabolic-ninja-worker | Flask | RabbitMQ → SendGrid       | Job consumer, emails on completion                   |
| id-mapper            | Flask  | **Neo4j** (loaded dump)   | Cross-database entity ID translation                 |
| metanetx             | Flask  | stateless (in-RAM)        | MetaNetX integration                                 |

Frontend views: Home, Projects, Models, Maps, Media, Designs, Design,
InteractiveMap, Jobs, JobDetails, Experiments, CommunityModeling,
PasswordReset (and legal pages). Vuex modules: `session, consents,
projects, models, maps, media, designs, experiments, strains, organisms,
jobs, interactiveMap`.

## Target shape (what we are building)

```
Vercel
└── Next.js 16 App Router + MUI v9 + TS + Auth.js v5
    ├── UI: every original view
    ├── Postgres (Neon) — single DB, replaces iam/maps/model_storage/
    │                     warehouse/designs + Neo4j + Redis + RabbitMQ
    ├── Drizzle ORM — schema in packages/db, migrations checked in
    ├── pg-boss queue in same DB (Phase 4) — replaces RabbitMQ
    └── Cloudflare R2 — SBML, CSV uploads (Escher map JSON stays inline
                                            in Postgres)

Modal (Python services — only where cobrapy/cameo matters)
├── caffeine-model-parser  FastAPI, SBML validation + metadata
├── caffeine-simulations   FastAPI, FBA / FVA / maximum_yield
└── caffeine-ninja         (Phase 4) pg-boss consumer, pathway prediction

Resend (Phase 4) — emails on job completion. Replaces SendGrid.
```

The collapse from 10 services to 1 web app + 3 small Python services is
deliberate. The original microservice split made sense for a team of
~15 people; for one maintainer it was the reason the platform died.

## Decisions and their reasoning

These are settled. If you want to revisit one, ask the user first.

- **Single Postgres on Neon.** Way simpler ops at this scale than the
  original 6 service DBs. Schema in `packages/db/src/schema/`.
- **Auth.js + Google.** Replaces the `iam` service. Adapter is lazy
  (see `apps/web/src/auth.ts`) so builds don't require `DATABASE_URL`.
  Sessions are JWT-strategy; the Drizzle adapter persists users and
  links accounts.
- **Modal for Python.** cobrapy + a working LP solver exceeds Vercel
  Function size; metabolic-ninja jobs exceed the timeout. Modal handles
  big images, long jobs, and has built-in queues. Free tier covers the
  expected traffic.
- **Cloudflare R2** for blob storage. User is on Vercel Hobby (no
  Vercel Blob). R2 is S3-compatible, used via `@aws-sdk/client-s3` with
  presigned PUT/GET (`apps/web/src/lib/storage.ts`).
- **Drizzle ORM** over Prisma. Better TS ergonomics with App Router;
  migrations live in code; the lazy proxy in `packages/db/src/index.ts`
  defers connection so the build works without `DATABASE_URL`.
- **Plain `escher@1.8.2`**, not `@dd-decaf/escher@1.9.7-decaf`. User
  confirmed. The dd-decaf fork has stale d3 deps. We may revisit if
  Phase 3+ design editing needs hooks the fork patched in; for now plain
  escher renders the same JSON the same way.
- **GLPK only, no CPLEX.** User decision. CPLEX licensing is too
  painful for redistribution.
- **pg-boss** (Phase 4) over RabbitMQ. Keeps everything in one Postgres.
- **Resend** (Phase 4) over SendGrid. Vercel-native.

## Stack and versions

Next 16, React 19, MUI v9, TypeScript 6, Auth.js 5 (beta.31 — supports
Next 16), Drizzle 0.45, Zod 4, TanStack Query 5, Zustand 5, Vitest 4,
Playwright 1.60, escher 1.8.2, AWS SDK v3 for R2.

`pnpm@10.33.0` is required (workspaces). Node ≥20.

Modal services: Python 3.12, cobra 0.29.1, cameo 0.13.6, FastAPI 0.115,
python-libsbml 5.20.4.

## Repo layout

```
apps/web/                 Next.js application
packages/db/              Drizzle schema, migrations, client, adapter
services/model-parser/    Modal: SBML validation
services/simulations/     Modal: FBA / FVA / maximum_yield
services/ninja/           Modal: (Phase 4) pathway prediction worker
```

## Phases — status and plan

- ✅ **0. Foundation.** Monorepo, Next.js + MUI shell, Auth.js (Google),
  Drizzle schema for every domain, R2 client. Tests: 14.
- ✅ **1. Projects + Models.** Project CRUD with role-based access via
  `project_membership`. SBML upload → R2 → `model-parser` Modal call →
  metadata stored. Tests: +11.
- ✅ **2. Maps + read-only Interactive Map.** Map CRUD (JSON stored
  inline in Postgres), Escher React wrapper (client-only, dynamic
  import), upload JSON file or paste JSON. Tests: +14.
- ✅ **3. Designs + simulations + FBA-driven map overlays.** Design CRUD,
  `simulations` Modal service (FBA / FVA / maximum_yield with model
  caching), Zustand design editor, fluxes paint onto the Escher viewer.
  Tests: +11. Known gaps below.
- ⏳ **4. Jobs + metabolic-ninja.** pg-boss queue in Postgres, ninja
  worker on Modal (`cameo` heterologous pathway prediction), Jobs UI
  with status polling, Resend email on completion.
- ⏳ **5. Warehouse: experiments + strains + media.** CRUD + UIs.
  Schema is already in place (`schema/warehouse.ts`, `schema/media.ts`).
- ⏳ **6. Proteomics + fermentation uploads.** CSV → presigned R2 PUT →
  server-side parse → rows in `measurement` table. Simple charts (MUI X
  Charts). This is the feature not in the demo video.
- ⏳ **7. Community modeling + id-mapper.** Restore the original Neo4j
  `id-mapper.dump` data — the user confirmed they can produce it. Port
  to the existing `id_mapping` table in Postgres. Wire up the community
  modeling view (multi-organism FBA).
- ⏳ **8. Cutover.** Seed public models & maps (user will provide JSON),
  point `caffeine.dd-decaf.eu` DNS at Vercel, retire `caffeine-tombstone`.

## Known gaps and TODOs (from Phase 3 review)

- **Design editor uses free-form text inputs** for reaction/gene IDs.
  Need to populate dropdowns from parsed model metadata. Either extend
  `model-parser` to also return all reaction/gene IDs and store them in
  the model row, or add `GET /api/models/[id]/reactions` that fetches +
  parses lazily.
- **Knockouts via map clicks** aren't wired. The original Caffeine used
  Escher's `selection_callback`; we can do the same in `EscherMap.tsx`.
- **Up/down regulation** in `services/simulations/modal_app.py` uses a
  simple scaling on existing bounds. The original used reference-flux ×
  fold, which needs a two-pass FBA (compute reference, then constrain).
- **`pnpm-lock.yaml`** is committed. If you bump deps, re-run
  `pnpm install` to refresh it; don't hand-edit.
- **ESLint** config is minimal (`apps/web/eslint.config.mjs` just sets
  ignores). The ESLint 10 + Next 16 + `eslint-config-next` ecosystem was
  unstable at scaffold time; revisit when their flat-config story
  stabilises.
- **No CI workflow** yet. Suggest a `.github/workflows/ci.yml` that runs
  `pnpm -r typecheck && pnpm -r test && pnpm --filter @caffeine/web build`
  on push.

## Conventions

Read these before writing code. They are not arbitrary.

### File layout

- New API routes: `apps/web/src/app/api/.../route.ts`. Always wrap in
  `try / catch (err) { return handleError(err) }`. Throw typed errors
  from `lib/errors` (`UnauthorizedError`, `ForbiddenError`,
  `NotFoundError`); they get mapped to status codes in `handleError`.
- New schema tables: split into `packages/db/src/schema/<domain>.ts`,
  add the export in `schema/index.ts`. Run `pnpm db:generate` to emit a
  migration SQL file (commit it; this is the source of truth, not
  re-derived from the schema).
- DB columns are `snake_case`; TS fields are `camelCase` via Drizzle
  column-name mapping.
- New Python service: `services/<name>/modal_app.py` (Modal app),
  `requirements.txt`, `tests/test_<name>.py`, `README.md`.

### Access control

- `requireUser()` in `lib/session.ts` reads the session, throws
  `UnauthorizedError` on missing.
- `requireProjectAccess(projectId, userId)` in `lib/projects.ts` checks
  `project_membership`. Returns the user's role (`owner | editor |
  viewer`). Use the role for write-protection: viewers cannot mutate.
- Resources without a project (e.g. user-private things) fall back to
  comparing `ownerId === user.id`.

### Tests

- Vitest, jsdom env. Setup file mocks `next/font/google`,
  `next/navigation`, and `next-auth/react` so client components can be
  rendered without Next's runtime.
- For DOM tests use `renderWithProviders` from
  `apps/web/test/render.tsx` — wraps in ThemeProvider + QueryClient.
- For fetch mocks: `vi.stubGlobal("fetch", vi.fn<typeof fetch>(...))`.
  Type the mock with `vi.fn<typeof fetch>(...)` or assertions on
  `.mock.calls[0]` will fail because vitest types the tuple as empty.
- For module tests that exercise route handlers, do **not** import
  from `@/auth` directly — that pulls `next/server` into vitest and
  fails. Helpers shared between handlers and tests should live in
  `lib/errors`, `lib/http`, `lib/design-schema` etc., not `lib/session`.

### MUI v9 gotchas

- `Stack` no longer accepts `alignItems` or `justifyContent` shorthand
  props. Use `sx={{ alignItems: "center", justifyContent: ... }}`.
- `CardActionArea component={Link}` clashes with Next 16's typed routes
  on the polymorphic component prop. Wrap the whole `<Card>` in a Next
  `<Link>` instead, with `style={{ textDecoration: "none", color:
  "inherit" }}`.
- Some icon variants are gone in v9. The base `DeleteOutline` is
  removed; use `DeleteOutlineRounded` (or `Sharp` / `TwoTone`).
- `typedRoutes` is **disabled** in `next.config.ts`. Don't re-enable it
  until MUI ships richer polymorphic typings.

### Modal services

- All endpoints require `Authorization: Bearer <token>` where the
  token comes from the Modal secret (`caffeine-model-parser`,
  `caffeine-simulations`, etc.). The same value goes into the web
  app's `.env.local` as `MODEL_PARSER_TOKEN` / `SIMULATIONS_TOKEN`.
- Models are downloaded from R2 via a **presigned URL produced by the
  web app and passed in the request body**. The Modal service never
  needs R2 credentials.
- Use `with model as m:` to apply designs transiently so the in-process
  model cache stays clean across requests.
- pytest the service in `tests/` by building a toy `cobra.Model` in
  memory and writing SBML to bytes; monkeypatch `httpx.AsyncClient.get`
  to return those bytes. Don't hit Modal in unit tests.

## Local development

### Prereqs

- Neon Postgres (via Vercel Marketplace or directly at neon.tech). Get
  the `DATABASE_URL`.
- Cloudflare R2: create a bucket called `caffeine`, an API token, and a
  CORS rule allowing `PUT, GET, HEAD` from `http://localhost:4200` and
  your Vercel domain.
- Google OAuth: create an OAuth client at console.cloud.google.com.
  Authorized redirect: `http://localhost:4200/api/auth/callback/google`
  for local; add your Vercel URL for prod.
- Modal: `pip install modal && modal token new`. Create secrets:
  ```sh
  modal secret create caffeine-model-parser \
      MODEL_PARSER_TOKEN=$(openssl rand -hex 32)
  modal secret create caffeine-simulations \
      SIMULATIONS_TOKEN=$(openssl rand -hex 32)
  ```
  Deploy: `cd services/model-parser && modal deploy modal_app.py`
  (same for `services/simulations`). Copy the printed URLs.

### `.env.local`

Copy `.env.example`. Fill in:

```
DATABASE_URL=postgres://...
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_URL=http://localhost:4200
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=caffeine
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
MODAL_MODEL_PARSER_URL=https://...modal.run
MODEL_PARSER_TOKEN=<same as Modal secret>
MODAL_SIMULATIONS_URL=https://...modal.run
SIMULATIONS_TOKEN=<same as Modal secret>
```

### Commands

```sh
pnpm install
pnpm db:migrate           # apply migrations to Neon
pnpm dev                  # http://localhost:4200
pnpm -r test              # vitest across all workspaces
pnpm -r typecheck         # tsc
pnpm --filter @caffeine/web test:e2e   # Playwright
pnpm db:generate          # after editing schema/*
pnpm db:studio            # Drizzle Studio
```

For the Modal services:

```sh
cd services/<name>
pip install -r requirements.txt   # for local pytest
pytest                            # unit tests, no Modal runtime needed
modal serve modal_app.py          # hot-reloading dev URL
modal deploy modal_app.py         # production deploy
```

## When picking up the next phase

1. Read the schema in `packages/db/src/schema/` — most domains are
   already modeled. You usually don't need new tables.
2. The pattern for adding a new entity is well-established by
   Projects / Models / Maps / Designs. Follow it: schema → migration →
   API routes → API client method → list/detail pages → tests.
3. For new Modal services, copy the shape of `services/simulations/`:
   `modal_app.py` with bearer auth + Pydantic models + a small in-
   process cache + `tests/test_*.py` that monkeypatches `httpx`.
4. If a decision feels load-bearing (deps, hosting, schema break),
   stop and ask. The user is hands-on and prefers being consulted on
   architecture choices. They specifically chose: faithful revival
   scope, Modal for Python, Auth.js + Postgres, single Postgres, R2 for
   blobs, plain `escher`, no CPLEX.

## What the user typically expects in a session

- Concise text updates between tool calls — what's about to happen, not
  a play-by-play.
- Tests written alongside code, not as an afterthought.
- Deps kept up to date (`pnpm update --latest -r` is fine to run).
- Commits with thoughtful messages (look at `git log` for the style).
  Phase-shaped commits, not one-per-file.
- Push to the branch `claude/restore-kubernetes-config-Vr4M3` (yes, the
  name is stale — the user hasn't asked to rename it; don't unilaterally
  rename).
- Don't create a PR unless explicitly asked.
