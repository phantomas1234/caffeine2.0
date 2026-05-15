import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/projects";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { designPayloadSchema } from "@/lib/design-schema";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid(),
  modelId: z.string().uuid(),
  design: designPayloadSchema,
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
    const modelId = req.nextUrl.searchParams.get("modelId") ?? undefined;

    if (projectId) {
      await requireProjectAccess(projectId, user.id);
      const rows = await db
        .select()
        .from(schema.designs)
        .where(
          modelId
            ? and(
                eq(schema.designs.projectId, projectId),
                eq(schema.designs.modelId, modelId),
              )
            : eq(schema.designs.projectId, projectId),
        )
        .orderBy(desc(schema.designs.createdAt));
      return NextResponse.json({ designs: rows });
    }

    const memberships = await db
      .select({ projectId: schema.projectMemberships.projectId })
      .from(schema.projectMemberships)
      .where(eq(schema.projectMemberships.userId, user.id));
    const projectIds = memberships.map((m) => m.projectId);
    if (projectIds.length === 0) return NextResponse.json({ designs: [] });

    const rows = await db
      .select()
      .from(schema.designs)
      .where(
        or(
          inArray(schema.designs.projectId, projectIds),
          eq(schema.designs.ownerId, user.id),
        ),
      )
      .orderBy(desc(schema.designs.createdAt));

    return NextResponse.json({ designs: rows });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());
    await requireProjectAccess(body.projectId, user.id);

    const [design] = await db
      .insert(schema.designs)
      .values({
        name: body.name,
        description: body.description,
        projectId: body.projectId,
        modelId: body.modelId,
        ownerId: user.id,
        design: body.design,
      })
      .returning();

    return NextResponse.json({ design }, { status: 201 });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}
