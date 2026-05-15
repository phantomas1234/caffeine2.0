import { z } from "zod";
import { DesignPayload, toSimulationsDesign } from "./design-schema";

export class SimulationsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationsError";
  }
}

const fbaResponseSchema = z.object({
  status: z.string(),
  objective_value: z.number().nullable().optional(),
  objective_reaction: z.string().nullable().optional(),
  growth_rate: z.number().nullable().optional(),
  fluxes: z.record(z.string(), z.number()).default({}),
  errors: z.array(z.string()).default([]),
});
export type FbaResult = z.infer<typeof fbaResponseSchema>;

const fvaResponseSchema = z.object({
  status: z.string(),
  ranges: z
    .record(z.string(), z.object({ min: z.number(), max: z.number() }))
    .default({}),
  errors: z.array(z.string()).default([]),
});
export type FvaResult = z.infer<typeof fvaResponseSchema>;

const maxYieldResponseSchema = z.object({
  status: z.string(),
  max_yield: z.number().nullable().optional(),
  units: z.string().default("mol/mol"),
  errors: z.array(z.string()).default([]),
});
export type MaxYieldResult = z.infer<typeof maxYieldResponseSchema>;

function getConfig(): { endpoint: string; token: string } {
  const endpoint = process.env.MODAL_SIMULATIONS_URL;
  const token = process.env.SIMULATIONS_TOKEN;
  if (!endpoint || !token) {
    throw new SimulationsError(
      "simulations service not configured (set MODAL_SIMULATIONS_URL and SIMULATIONS_TOKEN)",
    );
  }
  return { endpoint: endpoint.replace(/\/$/, ""), token };
}

async function call<T>(
  path: string,
  body: unknown,
  parser: (raw: unknown) => T,
): Promise<T> {
  const { endpoint, token } = getConfig();
  const res = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new SimulationsError(
      `simulations ${path} returned ${res.status}: ${text.slice(0, 200)}`,
    );
  }
  return parser(await res.json());
}

export async function runFba(args: {
  modelUrl: string;
  design?: DesignPayload;
  objective?: string;
}): Promise<FbaResult> {
  return call(
    "/fba",
    {
      url: args.modelUrl,
      design: args.design ? toSimulationsDesign(args.design) : null,
      objective: args.objective,
    },
    (raw) => fbaResponseSchema.parse(raw),
  );
}

export async function runFva(args: {
  modelUrl: string;
  design?: DesignPayload;
  reactions?: string[];
  fractionOfOptimum?: number;
}): Promise<FvaResult> {
  return call(
    "/fva",
    {
      url: args.modelUrl,
      design: args.design ? toSimulationsDesign(args.design) : null,
      reactions: args.reactions,
      fraction_of_optimum: args.fractionOfOptimum ?? 0.9,
    },
    (raw) => fvaResponseSchema.parse(raw),
  );
}

export async function runMaximumYield(args: {
  modelUrl: string;
  productId: string;
  substrateId: string;
  design?: DesignPayload;
}): Promise<MaxYieldResult> {
  return call(
    "/maximum_yield",
    {
      url: args.modelUrl,
      product_id: args.productId,
      substrate_id: args.substrateId,
      design: args.design ? toSimulationsDesign(args.design) : null,
    },
    (raw) => maxYieldResponseSchema.parse(raw),
  );
}
