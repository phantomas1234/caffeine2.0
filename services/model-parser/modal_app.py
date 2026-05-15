"""Modal app: SBML parser & validator.

Exposes a single FastAPI endpoint `POST /parse` that downloads an SBML
file from a presigned URL, parses it with cobrapy, and returns a summary.

The endpoint requires a bearer token (`MODEL_PARSER_TOKEN`) that is
shared with the Next.js app.

Local run:
    modal serve modal_app.py

Deploy:
    modal deploy modal_app.py
"""

from __future__ import annotations

import os
from typing import Any

import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libxml2", "libxml2-dev", "zlib1g-dev")
    .pip_install(
        "cobra==0.29.1",
        "fastapi==0.115.6",
        "httpx==0.28.1",
        "python-libsbml==5.20.4",
    )
)

app = modal.App("caffeine-model-parser", image=image)


@app.function(secrets=[modal.Secret.from_name("caffeine-model-parser")])
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, Header, HTTPException
    from pydantic import BaseModel

    web = FastAPI(title="Caffeine model-parser")

    class ParseRequest(BaseModel):
        url: str

    class ParseResponse(BaseModel):
        valid: bool
        reaction_count: int = 0
        metabolite_count: int = 0
        gene_count: int = 0
        compartments: list[str] = []
        organism: str | None = None
        errors: list[str] = []

    def _check_token(authorization: str | None) -> None:
        expected = os.environ.get("MODEL_PARSER_TOKEN")
        if not expected:
            raise HTTPException(500, "MODEL_PARSER_TOKEN not configured")
        if authorization != f"Bearer {expected}":
            raise HTTPException(401, "invalid token")

    @web.get("/health")
    def health() -> dict[str, Any]:
        return {"ok": True}

    @web.post("/parse", response_model=ParseResponse)
    async def parse(
        body: ParseRequest,
        authorization: str | None = Header(default=None),
    ) -> ParseResponse:
        _check_token(authorization)

        import httpx
        import cobra
        import io

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.get(body.url)
                resp.raise_for_status()
                content = resp.content
        except httpx.HTTPError as e:
            return ParseResponse(valid=False, errors=[f"download failed: {e}"])

        try:
            model = cobra.io.read_sbml_model(io.BytesIO(content))
        except Exception as e:  # cobrapy raises a wide range; surface message.
            return ParseResponse(valid=False, errors=[f"parse failed: {e}"])

        compartments = sorted(model.compartments.keys()) if model.compartments else []

        return ParseResponse(
            valid=True,
            reaction_count=len(model.reactions),
            metabolite_count=len(model.metabolites),
            gene_count=len(model.genes),
            compartments=compartments,
            organism=getattr(model, "name", None) or model.id,
        )

    return web
