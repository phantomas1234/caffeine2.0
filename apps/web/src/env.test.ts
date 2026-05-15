import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the env schema here so we can exercise it with controlled values.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
});

describe("env schema", () => {
  const ok = {
    DATABASE_URL: "postgres://u:p@host/db",
    AUTH_SECRET: "secret",
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "secret",
    R2_ACCOUNT_ID: "acct",
    R2_ACCESS_KEY_ID: "ak",
    R2_SECRET_ACCESS_KEY: "sk",
    R2_BUCKET: "caffeine",
    R2_ENDPOINT: "https://acct.r2.cloudflarestorage.com",
  };

  it("accepts a valid configuration", () => {
    const result = envSchema.safeParse(ok);
    expect(result.success).toBe(true);
  });

  it("rejects missing AUTH_SECRET", () => {
    const result = envSchema.safeParse({ ...ok, AUTH_SECRET: "" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed DATABASE_URL", () => {
    const result = envSchema.safeParse({ ...ok, DATABASE_URL: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed R2_ENDPOINT", () => {
    const result = envSchema.safeParse({ ...ok, R2_ENDPOINT: "bad" });
    expect(result.success).toBe(false);
  });
});
