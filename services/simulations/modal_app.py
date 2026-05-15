"""Modal app: cobrapy simulations.

Endpoints (all bearer-auth'd via the MODEL_PARSER_TOKEN-style secret
`SIMULATIONS_TOKEN`):

- POST /fba           run FBA with an optional design applied.
- POST /fva           flux variability analysis.
- POST /maximum_yield theoretical max yield of product on substrate.

The SBML model is fetched from a presigned URL passed in the request,
parsed once per worker, and cached in-process keyed by URL. Designs are
applied as transient model modifications inside a cobra.Model context
manager so the cache stays clean.

Local run:   modal serve modal_app.py
Deploy:      modal deploy modal_app.py
"""

from __future__ import annotations

import os
from typing import Any

import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libxml2", "libxml2-dev", "zlib1g-dev", "build-essential")
    .pip_install(
        "cobra==0.29.1",
        "cameo==0.13.6",
        "fastapi==0.115.6",
        "httpx==0.28.1",
        "python-libsbml==5.20.4",
        "numpy==1.26.4",
    )
)

app = modal.App("caffeine-simulations", image=image)


@app.function(
    secrets=[modal.Secret.from_name("caffeine-simulations")],
    timeout=300,
    # Keep a worker warm so consecutive simulations on the same model
    # reuse the parsed cobra.Model object.
    min_containers=0,
)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, Header, HTTPException
    from pydantic import BaseModel, Field

    web = FastAPI(title="Caffeine simulations")

    # In-process model cache: { url: cobra.Model }
    _cache: dict[str, Any] = {}

    class ReactionBound(BaseModel):
        id: str
        lower: float | None = None
        upper: float | None = None

    class ReactionFold(BaseModel):
        id: str
        fold: float

    class Design(BaseModel):
        gene_knockouts: list[str] = Field(default_factory=list)
        reaction_knockouts: list[str] = Field(default_factory=list)
        reaction_upregulations: list[ReactionFold] = Field(default_factory=list)
        reaction_downregulations: list[ReactionFold] = Field(default_factory=list)
        reaction_bounds: list[ReactionBound] = Field(default_factory=list)
        medium_exchanges: list[ReactionBound] = Field(default_factory=list)

    class FbaRequest(BaseModel):
        url: str
        design: Design | None = None
        objective: str | None = None  # reaction id, defaults to model's

    class FbaResponse(BaseModel):
        status: str
        objective_value: float | None = None
        objective_reaction: str | None = None
        growth_rate: float | None = None
        fluxes: dict[str, float] = Field(default_factory=dict)
        errors: list[str] = Field(default_factory=list)

    class FvaRequest(BaseModel):
        url: str
        design: Design | None = None
        reactions: list[str] | None = None
        fraction_of_optimum: float = 0.9

    class FvaResponse(BaseModel):
        status: str
        ranges: dict[str, dict[str, float]] = Field(default_factory=dict)
        errors: list[str] = Field(default_factory=list)

    class MaxYieldRequest(BaseModel):
        url: str
        product_id: str
        substrate_id: str
        design: Design | None = None

    class MaxYieldResponse(BaseModel):
        status: str
        max_yield: float | None = None
        units: str = "mol/mol"
        errors: list[str] = Field(default_factory=list)

    def _check_token(authorization: str | None) -> None:
        expected = os.environ.get("SIMULATIONS_TOKEN")
        if not expected:
            raise HTTPException(500, "SIMULATIONS_TOKEN not configured")
        if authorization != f"Bearer {expected}":
            raise HTTPException(401, "invalid token")

    async def _get_model(url: str):
        import cobra
        import httpx
        import io

        cached = _cache.get(url)
        if cached is not None:
            return cached

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            content = resp.content

        model = cobra.io.read_sbml_model(io.BytesIO(content))
        _cache[url] = model
        return model

    def _apply_design(model, design: Design | None) -> None:
        """Apply a design in-place inside a model context manager."""
        if design is None:
            return
        for r in design.reaction_knockouts:
            try:
                model.reactions.get_by_id(r).knock_out()
            except KeyError:
                pass
        for g in design.gene_knockouts:
            try:
                model.genes.get_by_id(g).knock_out()
            except KeyError:
                pass
        for b in design.reaction_bounds:
            try:
                rxn = model.reactions.get_by_id(b.id)
                if b.lower is not None:
                    rxn.lower_bound = b.lower
                if b.upper is not None:
                    rxn.upper_bound = b.upper
            except KeyError:
                pass
        for ex in design.medium_exchanges:
            try:
                rxn = model.reactions.get_by_id(ex.id)
                if ex.lower is not None:
                    rxn.lower_bound = ex.lower
                if ex.upper is not None:
                    rxn.upper_bound = ex.upper
            except KeyError:
                pass

        # Up/down regulation: cap the bound at fold * reference flux. We approximate
        # the reference flux as the current optimum on the unmodified objective,
        # taken before any other modifications would affect it. For now, treat the
        # fold as a scaling on the current bound (simple, deterministic).
        for up in design.reaction_upregulations:
            try:
                rxn = model.reactions.get_by_id(up.id)
                if rxn.upper_bound > 0:
                    rxn.upper_bound = rxn.upper_bound * max(up.fold, 1.0)
                if rxn.lower_bound < 0:
                    rxn.lower_bound = rxn.lower_bound * max(up.fold, 1.0)
            except KeyError:
                pass
        for dn in design.reaction_downregulations:
            try:
                rxn = model.reactions.get_by_id(dn.id)
                if rxn.upper_bound > 0:
                    rxn.upper_bound = rxn.upper_bound * min(dn.fold, 1.0)
                if rxn.lower_bound < 0:
                    rxn.lower_bound = rxn.lower_bound * min(dn.fold, 1.0)
            except KeyError:
                pass

    @web.get("/health")
    def health() -> dict[str, Any]:
        return {"ok": True, "cached_models": len(_cache)}

    @web.post("/fba", response_model=FbaResponse)
    async def fba(
        body: FbaRequest,
        authorization: str | None = Header(default=None),
    ) -> FbaResponse:
        _check_token(authorization)
        try:
            model = await _get_model(body.url)
        except Exception as e:
            return FbaResponse(status="error", errors=[f"load failed: {e}"])

        with model as m:
            if body.objective:
                try:
                    m.objective = body.objective
                except Exception as e:
                    return FbaResponse(
                        status="error",
                        errors=[f"unknown objective {body.objective}: {e}"],
                    )
            _apply_design(m, body.design)
            try:
                solution = m.optimize()
            except Exception as e:
                return FbaResponse(status="error", errors=[f"solver failed: {e}"])

            obj_reaction = next(iter(m.objective.variables_dict)) if hasattr(m.objective, "variables_dict") else None
            fluxes = {rxn.id: float(solution.fluxes[rxn.id]) for rxn in m.reactions}
            return FbaResponse(
                status=str(solution.status),
                objective_value=float(solution.objective_value)
                if solution.objective_value is not None
                else None,
                objective_reaction=obj_reaction,
                growth_rate=float(solution.objective_value)
                if solution.objective_value is not None
                else None,
                fluxes=fluxes,
            )

    @web.post("/fva", response_model=FvaResponse)
    async def fva(
        body: FvaRequest,
        authorization: str | None = Header(default=None),
    ) -> FvaResponse:
        _check_token(authorization)
        from cobra.flux_analysis import flux_variability_analysis

        try:
            model = await _get_model(body.url)
        except Exception as e:
            return FvaResponse(status="error", errors=[f"load failed: {e}"])

        with model as m:
            _apply_design(m, body.design)
            try:
                reactions = (
                    [m.reactions.get_by_id(r) for r in body.reactions]
                    if body.reactions
                    else None
                )
                df = flux_variability_analysis(
                    m,
                    reaction_list=reactions,
                    fraction_of_optimum=body.fraction_of_optimum,
                )
            except Exception as e:
                return FvaResponse(status="error", errors=[f"fva failed: {e}"])

            return FvaResponse(
                status="optimal",
                ranges={
                    rxn_id: {
                        "min": float(row["minimum"]),
                        "max": float(row["maximum"]),
                    }
                    for rxn_id, row in df.iterrows()
                },
            )

    @web.post("/maximum_yield", response_model=MaxYieldResponse)
    async def maximum_yield(
        body: MaxYieldRequest,
        authorization: str | None = Header(default=None),
    ) -> MaxYieldResponse:
        _check_token(authorization)
        try:
            model = await _get_model(body.url)
        except Exception as e:
            return MaxYieldResponse(status="error", errors=[f"load failed: {e}"])

        with model as m:
            _apply_design(m, body.design)
            try:
                prod = m.reactions.get_by_id(body.product_id)
                sub = m.reactions.get_by_id(body.substrate_id)
            except KeyError as e:
                return MaxYieldResponse(
                    status="error", errors=[f"reaction not found: {e}"]
                )

            try:
                m.objective = prod
                sol = m.optimize()
                product_flux = float(sol.objective_value) if sol.objective_value else 0.0
                substrate_flux = float(sol.fluxes[sub.id])
                if substrate_flux == 0:
                    return MaxYieldResponse(
                        status="error",
                        errors=["substrate flux is zero; cannot compute yield"],
                    )
                # Substrate uptake is negative in cobra's convention.
                max_yield_val = product_flux / abs(substrate_flux)
                return MaxYieldResponse(status="optimal", max_yield=max_yield_val)
            except Exception as e:
                return MaxYieldResponse(
                    status="error", errors=[f"yield calc failed: {e}"]
                )

    return web
