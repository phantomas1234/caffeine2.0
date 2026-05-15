import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/projects";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { designPayloadSchema } from "@/lib/design-schema";

const idSchema = z.string().uuid();

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  design: designPayloadSchema.optional(),
});

async function loadDesign(id: string) {
  const [design] = await db
    .select()
    .from(schema.designs)
    .where(eq(schema.designs.id, id))
    .limit(1);
  return design;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    idSchema.parse(id);
    const design = await loadDesign(id);
    if (!design) return jsonError(404, "design not found");
    if (design.projectId) await requireProjectAccess(design.projectId, user.id);
    else if (design.ownerId !== user.id) return jsonError(403, "forbidden");
    return NextResponse.json({ design });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    idSchema.parse(id);
    const existing = await loadDesign(id);
    if (!existing) return jsonError(404, "design not found");
    if (existing.projectId) {
      const access = await requireProjectAccess(existing.projectId, user.id);
      if (access.role === "viewer") return jsonError(403, "forbidden");
    } else if (existing.ownerId !== user.id) return jsonError(403, "forbidden");

    const body = patchSchema.parse(await req.json());
    const [design] = await db
      .update(schema.designs)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.designs.id, id))
      .returning();
    return NextResponse.json({ design });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    idSchema.parse(id);
    const existing = await loadDesign(id);
    if (!existing) return jsonError(404, "design not found");
    if (existing.projectId) {
      const access = await requireProjectAccess(existing.projectId, user.id);
      if (access.role === "viewer") return jsonError(403, "forbidden");
    } else if (existing.ownerId !== user.id) return jsonError(403, "forbidden");

    await db.delete(schema.designs).where(eq(schema.designs.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}
