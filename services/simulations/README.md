# simulations (Modal)

cobrapy-based FBA, FVA, and theoretical max yield. Called by Next.js
when a user runs a design from the Interactive Map or the design editor.

## Setup

```sh
pip install modal
modal token new
modal secret create caffeine-simulations \
    SIMULATIONS_TOKEN=$(openssl rand -hex 32)
modal deploy modal_app.py
```

Then set `MODAL_SIMULATIONS_URL` (the printed URL) and `SIMULATIONS_TOKEN`
(the same secret value) in the web app's `.env.local`.

## Endpoints

All endpoints take `Authorization: Bearer <SIMULATIONS_TOKEN>` and
`url` (a presigned SBML download URL produced by the web app).

### `POST /fba`

```json
{
  "url": "https://r2.example/model.xml",
  "design": {
    "reaction_knockouts": ["PFK"],
    "gene_knockouts": [],
    "reaction_bounds": [{"id": "EX_glc__D_e", "lower": -10}]
  },
  "objective": "BIOMASS_Ecoli_core_w_GAM"
}
```

Returns `{ status, objective_value, growth_rate, fluxes: { reaction_id: number } }`.

### `POST /fva`

```json
{
  "url": "...",
  "reactions": ["PFK", "PYK"],
  "fraction_of_optimum": 0.9
}
```

Returns `{ status, ranges: { reaction_id: { min, max } } }`.

### `POST /maximum_yield`

```json
{
  "url": "...",
  "product_id": "EX_succ_e",
  "substrate_id": "EX_glc__D_e"
}
```

Returns `{ status, max_yield, units }`.

## Caching

Each container caches parsed `cobra.Model` instances keyed by SBML URL,
so repeated FBA / FVA on the same model skips the parse. Designs are
applied transiently inside a `with model as m:` context so the cache
stays clean across requests.
