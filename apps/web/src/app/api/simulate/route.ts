import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/projects";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { presignDownload } from "@/lib/storage";
import { designPayloadSchema } from "@/lib/design-schema";
import {
  runFba,
  runFva,
  runMaximumYield,
  SimulationsError,
} from "@/lib/simulations";

const bodySchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("fba"),
    modelId: z.string().uuid(),
    design: designPayloadSchema.optional(),
    objective: z.string().optional(),
  }),
  z.object({
    method: z.literal("fva"),
    modelId: z.string().uuid(),
    design: designPayloadSchema.optional(),
    reactions: z.array(z.string()).optional(),
    fractionOfOptimum: z.number().min(0).max(1).optional(),
  }),
  z.object({
    method: z.literal("maximum_yield"),
    modelId: z.string().uuid(),
    productId: z.string().min(1),
    substrateId: z.string().min(1),
    design: designPayloadSchema.optional(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = bodySchema.parse(await req.json());

    const [model] = await db
      .select()
      .from(schema.models)
      .where(eq(schema.models.id, body.modelId))
      .limit(1);
    if (!model) return jsonError(404, "model not found");
    if (model.projectId) await requireProjectAccess(model.projectId, user.id);
    else if (model.ownerId !== user.id) return jsonError(403, "forbidden");

    const modelUrl = await presignDownload(model.sbmlObjectKey);

    switch (body.method) {
      case "fba": {
        const result = await runFba({
          modelUrl,
          design: body.design,
          objective: body.objective,
        });
        return NextResponse.json({ method: "fba", result });
      }
      case "fva": {
        const result = await runFva({
          modelUrl,
          design: body.design,
          reactions: body.reactions,
          fractionOfOptimum: body.fractionOfOptimum,
        });
        return NextResponse.json({ method: "fva", result });
      }
      case "maximum_yield": {
        const result = await runMaximumYield({
          modelUrl,
          design: body.design,
          productId: body.productId,
          substrateId: body.substrateId,
        });
        return NextResponse.json({ method: "maximum_yield", result });
      }
    }
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    if (err instanceof SimulationsError) return jsonError(502, err.message);
    return handleError(err);
  }
}
