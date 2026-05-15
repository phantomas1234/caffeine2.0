import { describe, it, expect } from "vitest";
import {
  designPayloadSchema,
  toSimulationsDesign,
  emptyDesign,
} from "./design-schema";

describe("designPayloadSchema", () => {
  it("accepts an empty design via defaults", () => {
    const parsed = designPayloadSchema.parse({});
    expect(parsed).toEqual(emptyDesign);
  });

  it("rejects malformed folds", () => {
    expect(() =>
      designPayloadSchema.parse({
        reactionUpregulations: [{ id: "PFK" }],
      }),
    ).toThrow();
  });

  it("accepts a fully-populated payload", () => {
    const parsed = designPayloadSchema.parse({
      geneKnockouts: ["b1234"],
      reactionKnockouts: ["PFK"],
      reactionUpregulations: [{ id: "PYK", fold: 2 }],
      reactionDownregulations: [{ id: "ENO", fold: 0.5 }],
      reactionBounds: [{ id: "EX_o2_e", upper: 0 }],
      mediumExchanges: [{ id: "EX_glc__D_e", lower: -10 }],
    });
    expect(parsed.reactionKnockouts).toEqual(["PFK"]);
    expect(parsed.reactionUpregulations[0].fold).toBe(2);
  });
});

describe("toSimulationsDesign", () => {
  it("converts camelCase to snake_case for the Modal wire format", () => {
    const wire = toSimulationsDesign({
      geneKnockouts: ["g1"],
      reactionKnockouts: ["r1"],
      reactionUpregulations: [{ id: "r2", fold: 2 }],
      reactionDownregulations: [{ id: "r3", fold: 0.5 }],
      reactionBounds: [{ id: "r4", lower: -10 }],
      mediumExchanges: [{ id: "EX_glc__D_e", lower: -10 }],
    });
    expect(wire.gene_knockouts).toEqual(["g1"]);
    expect(wire.reaction_knockouts).toEqual(["r1"]);
    expect(wire.reaction_upregulations[0]).toEqual({ id: "r2", fold: 2 });
    expect(wire.medium_exchanges[0]).toEqual({ id: "EX_glc__D_e", lower: -10 });
  });
});
