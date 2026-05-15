import { describe, it, expect } from "vitest";
import { z } from "zod";
import { handleError, jsonError } from "./http";
import { UnauthorizedError } from "./errors";

describe("http helpers", () => {
  it("jsonError sets the status code and message", async () => {
    const res = jsonError(404, "not found");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not found");
  });

  it("handleError maps UnauthorizedError to 401", async () => {
    const res = handleError(new UnauthorizedError());
    expect(res.status).toBe(401);
  });

  it("handleError maps ZodError to 400 with details", async () => {
    let caught: unknown;
    try {
      z.object({ a: z.string() }).parse({ a: 1 });
    } catch (e) {
      caught = e;
    }
    const res = handleError(caught);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid input");
    expect(body.details).toBeDefined();
  });

  it("handleError falls back to 500 for generic errors", async () => {
    const res = handleError(new Error("boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("boom");
  });
});
