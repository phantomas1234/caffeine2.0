import { z } from "zod";

export const parseResultSchema = z.object({
  valid: z.boolean(),
  reaction_count: z.number().int().nonnegative().default(0),
  metabolite_count: z.number().int().nonnegative().default(0),
  gene_count: z.number().int().nonnegative().default(0),
  compartments: z.array(z.string()).default([]),
  organism: z.string().nullable().optional(),
  errors: z.array(z.string()).default([]),
});

export type ParseResult = z.infer<typeof parseResultSchema>;

export class ModelParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelParserError";
  }
}

export async function parseSbml(presignedUrl: string): Promise<ParseResult> {
  const endpoint = process.env.MODAL_MODEL_PARSER_URL;
  const token = process.env.MODEL_PARSER_TOKEN;
  if (!endpoint || !token) {
    throw new ModelParserError(
      "model-parser service not configured (set MODAL_MODEL_PARSER_URL and MODEL_PARSER_TOKEN)",
    );
  }

  const res = await fetch(`${endpoint.replace(/\/$/, "")}/parse`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: presignedUrl }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ModelParserError(
      `model-parser returned ${res.status}: ${body.slice(0, 200)}`,
    );
  }

  const data = await res.json();
  return parseResultSchema.parse(data);
}
