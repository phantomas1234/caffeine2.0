import { describe, it, expect } from "vitest";
import { theme } from "./theme";

describe("theme", () => {
  it("is constructed", () => {
    expect(theme).toBeDefined();
    expect(theme.palette).toBeDefined();
    expect(theme.shape).toBeDefined();
  });

  it("defines primary and secondary palette", () => {
    expect(theme.palette.primary.main).toBe("#5d4037");
    expect(theme.palette.secondary.main).toBe("#00897b");
  });

  it("sets a custom border radius", () => {
    expect(theme.shape.borderRadius).toBe(8);
  });
});
