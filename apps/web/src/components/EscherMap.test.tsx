import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";

const builderSpy = vi.fn();

vi.mock("d3-selection", () => ({
  select: (el: unknown) => ({ __isSel: true, el }),
}));

vi.mock("escher", () => {
  class Builder {
    constructor(
      mapData: unknown,
      modelData: unknown,
      css: string | null,
      sel: unknown,
      options: Record<string, unknown>,
    ) {
      builderSpy(mapData, modelData, css, sel, options);
    }
  }
  return { Builder };
});

beforeEach(() => {
  builderSpy.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("EscherMap", () => {
  it("constructs an Escher Builder with the map data on mount", async () => {
    const { EscherMap } = await import("./EscherMap");
    const mapData = [{ map_name: "demo" }, { reactions: {} }];
    renderWithProviders(<EscherMap mapData={mapData} readOnly />);

    await waitFor(() => expect(builderSpy).toHaveBeenCalledOnce());
    const [passedMap, passedModel, css, , options] =
      builderSpy.mock.calls[0]!;
    expect(passedMap).toBe(mapData);
    expect(passedModel).toBeNull();
    expect(css).toBeNull();
    expect((options as Record<string, unknown>).menu).toBe("none");
    expect((options as Record<string, unknown>).enable_editing).toBe(false);
  });

  it("enables editing when readOnly=false", async () => {
    const { EscherMap } = await import("./EscherMap");
    renderWithProviders(
      <EscherMap mapData={[{}, {}]} readOnly={false} />,
    );

    await waitFor(() => expect(builderSpy).toHaveBeenCalled());
    const [, , , , options] = builderSpy.mock.calls[0]!;
    expect((options as Record<string, unknown>).menu).toBe("all");
    expect((options as Record<string, unknown>).enable_editing).toBe(true);
  });

  it("forwards reactionData to escher", async () => {
    const { EscherMap } = await import("./EscherMap");
    renderWithProviders(
      <EscherMap mapData={[{}, {}]} reactionData={{ PFK: 1.2 }} />,
    );

    await waitFor(() => expect(builderSpy).toHaveBeenCalled());
    const [, , , , options] = builderSpy.mock.calls[0]!;
    expect((options as Record<string, unknown>).reaction_data).toEqual({
      PFK: 1.2,
    });
  });

  it("surfaces import failures as an error alert", async () => {
    vi.doMock("escher", () => {
      throw new Error("boom");
    });
    vi.resetModules();
    const { EscherMap } = await import("./EscherMap");
    renderWithProviders(<EscherMap mapData={[{}, {}]} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to render map/i)).toBeInTheDocument();
    });
    vi.doUnmock("escher");
  });
});
