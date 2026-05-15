import { describe, it, expect, beforeEach } from "vitest";
import { useDesignEditor } from "./design-editor";

describe("design editor store", () => {
  beforeEach(() => {
    useDesignEditor.getState().reset();
  });

  it("toggles a reaction knockout on and off", () => {
    const { toggleReactionKnockout } = useDesignEditor.getState();
    toggleReactionKnockout("PFK");
    expect(useDesignEditor.getState().design.reactionKnockouts).toEqual(["PFK"]);
    toggleReactionKnockout("PFK");
    expect(useDesignEditor.getState().design.reactionKnockouts).toEqual([]);
  });

  it("adds and clears reaction bounds", () => {
    const { setReactionBound } = useDesignEditor.getState();
    setReactionBound("EX_glc__D_e", { lower: -10 });
    expect(useDesignEditor.getState().design.reactionBounds).toEqual([
      { id: "EX_glc__D_e", lower: -10 },
    ]);
    setReactionBound("EX_glc__D_e", null);
    expect(useDesignEditor.getState().design.reactionBounds).toEqual([]);
  });

  it("replaces an existing bound when called twice", () => {
    const { setReactionBound } = useDesignEditor.getState();
    setReactionBound("PFK", { upper: 10 });
    setReactionBound("PFK", { lower: 0, upper: 5 });
    expect(useDesignEditor.getState().design.reactionBounds).toEqual([
      { id: "PFK", lower: 0, upper: 5 },
    ]);
  });

  it("resets to an empty design", () => {
    const { toggleReactionKnockout, toggleGeneKnockout, reset } =
      useDesignEditor.getState();
    toggleReactionKnockout("PFK");
    toggleGeneKnockout("b1234");
    reset();
    expect(useDesignEditor.getState().design.reactionKnockouts).toEqual([]);
    expect(useDesignEditor.getState().design.geneKnockouts).toEqual([]);
  });
});
