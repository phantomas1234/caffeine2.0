import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runFba,
  runFva,
  runMaximumYield,
  SimulationsError,
} from "./simulations";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.MODAL_SIMULATIONS_URL = "https://sim.example.com";
  process.env.SIMULATIONS_TOKEN = "test-token";
});
afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

function mockJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("runFba", () => {
  it("posts to /fba with the right shape and parses the result", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      mockJson({
        status: "optimal",
        objective_value: 0.87,
        growth_rate: 0.87,
        fluxes: { BIOMASS: 0.87, PFK: 7.5 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await runFba({
      modelUrl: "https://r2.example/model.xml",
      design: {
        geneKnockouts: [],
        reactionKnockouts: ["PFK"],
        reactionUpregulations: [],
        reactionDownregulations: [],
        reactionBounds: [{ id: "EX_glc__D_e", lower: -10 }],
        mediumExchanges: [],
      },
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://sim.example.com/fba");
    expect((init as RequestInit).headers).toMatchObject({
      authorization: "Bearer test-token",
    });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.url).toBe("https://r2.example/model.xml");
    expect(body.design.reaction_knockouts).toEqual(["PFK"]);
    expect(body.design.reaction_bounds[0]).toEqual({
      id: "EX_glc__D_e",
      lower: -10,
    });

    expect(res.growth_rate).toBe(0.87);
    expect(res.fluxes.PFK).toBe(7.5);
  });

  it("throws when config is missing", async () => {
    delete process.env.MODAL_SIMULATIONS_URL;
    await expect(
      runFba({ modelUrl: "https://x" }),
    ).rejects.toBeInstanceOf(SimulationsError);
  });

  it("surfaces non-2xx as SimulationsError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("nope", { status: 500 })),
    );
    await expect(runFba({ modelUrl: "https://x" })).rejects.toBeInstanceOf(
      SimulationsError,
    );
  });
});

describe("runFva", () => {
  it("posts to /fva and parses ranges", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        mockJson({
          status: "optimal",
          ranges: { PFK: { min: 0, max: 20 } },
        }),
      ),
    );
    const res = await runFva({
      modelUrl: "https://x",
      reactions: ["PFK"],
      fractionOfOptimum: 0.95,
    });
    expect(res.ranges.PFK).toEqual({ min: 0, max: 20 });
  });
});

describe("runMaximumYield", () => {
  it("posts product/substrate ids and returns a yield", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        mockJson({ status: "optimal", max_yield: 0.42, units: "mol/mol" }),
      ),
    );
    const res = await runMaximumYield({
      modelUrl: "https://x",
      productId: "EX_succ_e",
      substrateId: "EX_glc__D_e",
    });
    expect(res.max_yield).toBe(0.42);
  });
});
