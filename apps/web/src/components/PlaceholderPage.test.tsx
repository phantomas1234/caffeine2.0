import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { PlaceholderPage } from "./PlaceholderPage";

describe("PlaceholderPage", () => {
  it("renders title, phase chip, and description", () => {
    renderWithProviders(
      <PlaceholderPage
        title="Models"
        phase={1}
        description="Metabolic models."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Models" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Metabolic models.")).toBeInTheDocument();
  });
});
