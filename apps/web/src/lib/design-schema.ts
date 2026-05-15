import { z } from "zod";

export const reactionFoldSchema = z.object({
  id: z.string().min(1),
  fold: z.number(),
});

export const reactionBoundSchema = z.object({
  id: z.string().min(1),
  lower: z.number().optional(),
  upper: z.number().optional(),
});

export const designPayloadSchema = z.object({
  geneKnockouts: z.array(z.string()).default([]),
  reactionKnockouts: z.array(z.string()).default([]),
  reactionUpregulations: z.array(reactionFoldSchema).default([]),
  reactionDownregulations: z.array(reactionFoldSchema).default([]),
  reactionBounds: z.array(reactionBoundSchema).default([]),
  mediumExchanges: z.array(reactionBoundSchema).default([]),
});

export type DesignPayload = z.infer<typeof designPayloadSchema>;

export const emptyDesign: DesignPayload = {
  geneKnockouts: [],
  reactionKnockouts: [],
  reactionUpregulations: [],
  reactionDownregulations: [],
  reactionBounds: [],
  mediumExchanges: [],
};

// snake_case projection used over the wire to the Modal simulations service.
export function toSimulationsDesign(d: DesignPayload) {
  return {
    gene_knockouts: d.geneKnockouts,
    reaction_knockouts: d.reactionKnockouts,
    reaction_upregulations: d.reactionUpregulations,
    reaction_downregulations: d.reactionDownregulations,
    reaction_bounds: d.reactionBounds,
    medium_exchanges: d.mediumExchanges,
  };
}
