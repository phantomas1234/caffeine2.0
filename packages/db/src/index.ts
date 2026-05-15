import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export { schema };

let cached: NeonHttpDatabase<typeof schema> | undefined;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Configure it in .env.local or your deployment environment.",
      );
    }
    const sql: NeonQueryFunction<false, false> = neon(url);
    cached = drizzle({ client: sql, schema });
  }
  return cached;
}

// Proxy for ergonomic `db.select(...)` access; connection lazily created.
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Database = NeonHttpDatabase<typeof schema>;
