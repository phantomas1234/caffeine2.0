import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess, ForbiddenError, NotFoundError } from "@/lib/projects";
import { presignDownload } from "@/lib/storage";

const idSchema = z.string().uuid();

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    idSchema.parse(id);

    const [model] = await db
      .select()
      .from(schema.models)
      .where(eq(schema.models.id, id))
      .limit(1);

    if (!model) return jsonError(404, "model not found");

    if (model.projectId) {
      await requireProjectAccess(model.projectId, user.id);
    } else if (model.ownerId !== user.id) {
      return jsonError(403, "forbidden");
    }

    const downloadUrl = await presignDownload(model.sbmlObjectKey);

    return NextResponse.json({ model, downloadUrl });
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

    const [model] = await db
      .select()
      .from(schema.models)
      .where(eq(schema.models.id, id))
      .limit(1);

    if (!model) return jsonError(404, "model not found");

    if (model.projectId) {
      const access = await requireProjectAccess(model.projectId, user.id);
      if (access.role === "viewer") return jsonError(403, "forbidden");
    } else if (model.ownerId !== user.id) {
      return jsonError(403, "forbidden");
    }

    await db.delete(schema.models).where(eq(schema.models.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}
