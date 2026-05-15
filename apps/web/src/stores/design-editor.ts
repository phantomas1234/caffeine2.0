"use client";

import { create } from "zustand";
import { DesignPayload, emptyDesign } from "@/lib/design-schema";

type State = {
  modelId: string | null;
  design: DesignPayload;
  setModel: (modelId: string | null) => void;
  setDesign: (design: DesignPayload) => void;
  reset: () => void;

  toggleReactionKnockout: (id: string) => void;
  toggleGeneKnockout: (id: string) => void;
  setReactionBound: (
    id: string,
    bound: { lower?: number; upper?: number } | null,
  ) => void;
  setMediumExchange: (
    id: string,
    bound: { lower?: number; upper?: number } | null,
  ) => void;
};

export const useDesignEditor = create<State>((set) => ({
  modelId: null,
  design: emptyDesign,
  setModel: (modelId) => set({ modelId }),
  setDesign: (design) => set({ design }),
  reset: () => set({ modelId: null, design: emptyDesign }),

  toggleReactionKnockout: (id) =>
    set((s) => {
      const has = s.design.reactionKnockouts.includes(id);
      return {
        design: {
          ...s.design,
          reactionKnockouts: has
            ? s.design.reactionKnockouts.filter((r) => r !== id)
            : [...s.design.reactionKnockouts, id],
        },
      };
    }),

  toggleGeneKnockout: (id) =>
    set((s) => {
      const has = s.design.geneKnockouts.includes(id);
      return {
        design: {
          ...s.design,
          geneKnockouts: has
            ? s.design.geneKnockouts.filter((g) => g !== id)
            : [...s.design.geneKnockouts, id],
        },
      };
    }),

  setReactionBound: (id, bound) =>
    set((s) => {
      const others = s.design.reactionBounds.filter((b) => b.id !== id);
      return {
        design: {
          ...s.design,
          reactionBounds: bound ? [...others, { id, ...bound }] : others,
        },
      };
    }),

  setMediumExchange: (id, bound) =>
    set((s) => {
      const others = s.design.mediumExchanges.filter((b) => b.id !== id);
      return {
        design: {
          ...s.design,
          mediumExchanges: bound ? [...others, { id, ...bound }] : others,
        },
      };
    }),
}));
