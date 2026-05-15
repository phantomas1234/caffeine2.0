"""Smoke test for the model parser ASGI app.

Runs without Modal by directly invoking the underlying function.
"""

from __future__ import annotations

import io
import os

import pytest

os.environ.setdefault("MODEL_PARSER_TOKEN", "test-token")


@pytest.fixture(scope="session")
def textbook_sbml_bytes() -> bytes:
    """Build a tiny SBML model with cobrapy and serialize it."""
    import cobra

    model = cobra.Model("toy")
    a = cobra.Metabolite("A_c", compartment="c")
    b = cobra.Metabolite("B_c", compartment="c")
    r = cobra.Reaction("R1", lower_bound=0, upper_bound=1000)
    r.add_metabolites({a: -1, b: 1})
    model.add_reactions([r])

    buf = io.BytesIO()
    cobra.io.write_sbml_model(model, buf)
    return buf.getvalue()


def test_parse_valid_sbml(monkeypatch, textbook_sbml_bytes):
    import httpx

    from modal_app import fastapi_app  # type: ignore

    # `fastapi_app` is a Modal function; reach into its raw callable for tests.
    app = fastapi_app.get_raw_f()()  # type: ignore[attr-defined]

    async def fake_get(self, url, *args, **kwargs):
        class R:
            content = textbook_sbml_bytes

            def raise_for_status(self) -> None:
                return None

        return R()

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    from fastapi.testclient import TestClient

    client = TestClient(app)
    r = client.post(
        "/parse",
        json={"url": "https://example.com/model.xml"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["valid"] is True
    assert body["reaction_count"] == 1
    assert body["metabolite_count"] == 2


def test_parse_requires_token():
    from modal_app import fastapi_app  # type: ignore
    from fastapi.testclient import TestClient

    app = fastapi_app.get_raw_f()()  # type: ignore[attr-defined]
    client = TestClient(app)
    r = client.post("/parse", json={"url": "https://example.com/x.xml"})
    assert r.status_code == 401
