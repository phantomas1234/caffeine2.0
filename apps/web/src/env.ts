import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  R2_PUBLIC_URL: z.string().url().optional(),
  MODAL_SIMULATIONS_URL: z.string().url().optional(),
  MODAL_NINJA_URL: z.string().url().optional(),
  MODAL_MODEL_PARSER_URL: z.string().url().optional(),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
