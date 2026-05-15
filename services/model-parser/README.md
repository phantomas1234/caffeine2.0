# model-parser (Modal)

Validates SBML files and returns reaction/metabolite/gene/compartment
counts using cobrapy. Called by the Next.js app after a client uploads
an SBML file to R2.

## Setup

1. Sign up at https://modal.com and install the CLI:
   ```sh
   pip install modal
   modal token new
   ```
2. Create a shared secret (any random string; the Next.js app uses the
   same value):
   ```sh
   modal secret create caffeine-model-parser \
       MODEL_PARSER_TOKEN=$(openssl rand -hex 32)
   ```
3. Deploy:
   ```sh
   modal deploy modal_app.py
   ```
   Modal prints a URL like
   `https://<workspace>--caffeine-model-parser-fastapi-app.modal.run`.
4. Put that URL in the web app's `MODAL_MODEL_PARSER_URL` and the secret
   value in `MODEL_PARSER_TOKEN`.

## Local dev

```sh
modal serve modal_app.py
```

Hot-reloads on file changes; same Modal secret is used.

## Endpoint

`POST /parse`
- Header: `Authorization: Bearer <MODEL_PARSER_TOKEN>`
- Body: `{ "url": "<presigned R2 download URL>" }`
- Response: `{ valid, reaction_count, metabolite_count, gene_count, compartments, organism, errors }`
