"""Smoke tests for the simulations ASGI app.

Build a tiny linear-pathway model in-memory and exercise the endpoints
through FastAPI's TestClient. Modal's runtime isn't involved; we reach
into the underlying function returned by the modal asgi decorator.
"""

from __future__ import annotations

import io
import os

import pytest

os.environ.setdefault("SIMULATIONS_TOKEN", "test-token")


@pytest.fixture(scope="session")
def toy_sbml_bytes() -> bytes:
    """A tiny model: glucose enters, biomass is produced.

    EX_glc <- glc -> R1 -> biomass <- EX_biomass
    """
    import cobra

    model = cobra.Model("toy")
    glc = cobra.Metabolite("glc_e", compartment="e")
    glc_c = cobra.Metabolite("glc_c", compartment="c")
    bio = cobra.Metabolite("biomass_c", compartment="c")

    ex_glc = cobra.Reaction("EX_glc_e", lower_bound=-10, upper_bound=1000)
    ex_glc.add_metabolites({glc: -1})
    transport = cobra.Reaction("GLCt", lower_bound=-1000, upper_bound=1000)
    transport.add_metabolites({glc: -1, glc_c: 1})
    growth = cobra.Reaction("BIOMASS", lower_bound=0, upper_bound=1000)
    growth.add_metabolites({glc_c: -1, bio: 1})
    ex_bio = cobra.Reaction("EX_biomass_c", lower_bound=0, upper_bound=1000)
    ex_bio.add_metabolites({bio: -1})

    model.add_reactions([ex_glc, transport, growth, ex_bio])
    model.objective = growth

    buf = io.BytesIO()
    cobra.io.write_sbml_model(model, buf)
    return buf.getvalue()


@pytest.fixture()
def client(monkeypatch, toy_sbml_bytes):
    import httpx
    from fastapi.testclient import TestClient
    from modal_app import fastapi_app  # type: ignore

    async def fake_get(self, url, *args, **kwargs):
        class R:
            content = toy_sbml_bytes

            def raise_for_status(self) -> None:
                return None

        return R()

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)
    app = fastapi_app.get_raw_f()()  # type: ignore[attr-defined]
    return TestClient(app)


def auth() -> dict[str, str]:
    return {"Authorization": "Bearer test-token"}


def test_fba_runs_and_returns_growth(client):
    r = client.post(
        "/fba",
        json={"url": "https://e/x.xml"},
        headers=auth(),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "optimal"
    assert body["growth_rate"] is not None
    assert body["growth_rate"] > 0
    assert "BIOMASS" in body["fluxes"]


def test_fba_with_reaction_knockout_zeroes_growth(client):
    r = client.post(
        "/fba",
        json={
            "url": "https://e/x.xml",
            "design": {"reaction_knockouts": ["BIOMASS"]},
        },
        headers=auth(),
    )
    body = r.json()
    assert body["status"] == "optimal"
    assert body["growth_rate"] == 0.0 or body["growth_rate"] is None


def test_fba_requires_token(client):
    r = client.post("/fba", json={"url": "https://e/x.xml"})
    assert r.status_code == 401


def test_fva_returns_ranges(client):
    r = client.post(
        "/fva",
        json={"url": "https://e/x.xml", "reactions": ["BIOMASS"]},
        headers=auth(),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "BIOMASS" in body["ranges"]
    rng = body["ranges"]["BIOMASS"]
    assert rng["min"] <= rng["max"]


def test_maximum_yield(client):
    r = client.post(
        "/maximum_yield",
        json={
            "url": "https://e/x.xml",
            "product_id": "EX_biomass_c",
            "substrate_id": "EX_glc_e",
        },
        headers=auth(),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "optimal"
    assert body["max_yield"] is not None
    assert body["max_yield"] > 0
