import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess, NotFoundError, ForbiddenError } from "@/lib/projects";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

const idSchema = z.string().uuid();

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    idSchema.parse(id);
    const access = await requireProjectAccess(id, user.id);

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    if (!project) return jsonError(404, "project not found");
    return NextResponse.json({ project, role: access.role });
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
    const access = await requireProjectAccess(id, user.id);
    if (access.role === "viewer") return jsonError(403, "forbidden");

    const body = updateSchema.parse(await req.json());
    const [project] = await db
      .update(schema.projects)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.projects.id, id))
      .returning();

    return NextResponse.json({ project });
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
    const access = await requireProjectAccess(id, user.id);
    if (access.role !== "owner") return jsonError(403, "owner only");

    await db
      .delete(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, user.id)));

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}
