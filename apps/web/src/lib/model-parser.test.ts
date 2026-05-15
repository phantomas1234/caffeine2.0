import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseSbml, ModelParserError } from "./model-parser";

describe("parseSbml", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MODAL_MODEL_PARSER_URL = "https://parser.example.com";
    process.env.MODEL_PARSER_TOKEN = "test-token";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("calls the configured endpoint with bearer auth", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            valid: true,
            reaction_count: 95,
            metabolite_count: 72,
            gene_count: 137,
            compartments: ["c", "e"],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseSbml("https://r2.example/sbml.xml");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://parser.example.com/parse");
    expect((init as RequestInit).headers).toMatchObject({
      authorization: "Bearer test-token",
    });
    expect(result.valid).toBe(true);
    expect(result.reaction_count).toBe(95);
    expect(result.compartments).toEqual(["c", "e"]);
  });

  it("throws when the service is not configured", async () => {
    delete process.env.MODAL_MODEL_PARSER_URL;
    await expect(parseSbml("https://x")).rejects.toBeInstanceOf(
      ModelParserError,
    );
  });

  it("surfaces non-2xx responses as ModelParserError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(parseSbml("https://x")).rejects.toBeInstanceOf(
      ModelParserError,
    );
  });

  it("rejects malformed payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ valid: "yes" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    await expect(parseSbml("https://x")).rejects.toThrow();
  });
});
