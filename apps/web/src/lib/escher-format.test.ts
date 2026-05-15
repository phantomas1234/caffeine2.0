import { describe, it, expect } from "vitest";
import { isPlausibleEscherMap } from "./escher-format";

describe("isPlausibleEscherMap", () => {
  it("accepts the canonical [metadata, content] tuple", () => {
    expect(
      isPlausibleEscherMap([{ map_name: "demo" }, { reactions: {} }]),
    ).toBe(true);
  });

  it("rejects non-arrays", () => {
    expect(isPlausibleEscherMap({})).toBe(false);
    expect(isPlausibleEscherMap("string")).toBe(false);
    expect(isPlausibleEscherMap(null)).toBe(false);
  });

  it("rejects arrays of the wrong length", () => {
    expect(isPlausibleEscherMap([{}])).toBe(false);
    expect(isPlausibleEscherMap([{}, {}, {}])).toBe(false);
  });

  it("rejects arrays containing non-objects", () => {
    expect(isPlausibleEscherMap([{}, null])).toBe(false);
    expect(isPlausibleEscherMap([{}, "x"])).toBe(false);
    expect(isPlausibleEscherMap([null, {}])).toBe(false);
  });
});
