import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders the Caffeine title", () => {
    renderWithProviders(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Caffeine" })).toBeInTheDocument();
  });

  it("renders all primary nav items", () => {
    renderWithProviders(
      <AppShell>
        <div />
      </AppShell>,
    );

    for (const label of [
      "Projects",
      "Models",
      "Maps",
      "Media",
      "Designs",
      "Interactive Map",
      "Jobs",
      "Experiments",
      "Community Modeling",
      "Strains",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders a sign-in button when unauthenticated", () => {
    renderWithProviders(
      <AppShell>
        <div />
      </AppShell>,
    );
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("renders main content", () => {
    renderWithProviders(
      <AppShell>
        <div data-testid="page">hello</div>
      </AppShell>,
    );
    expect(screen.getByTestId("page")).toHaveTextContent("hello");
  });
});
