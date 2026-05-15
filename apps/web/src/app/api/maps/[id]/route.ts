import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/projects";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

const idSchema = z.string().uuid();

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    idSchema.parse(id);

    const [map] = await db
      .select()
      .from(schema.maps)
      .where(eq(schema.maps.id, id))
      .limit(1);

    if (!map) return jsonError(404, "map not found");
    if (map.projectId) await requireProjectAccess(map.projectId, user.id);
    else if (map.ownerId !== user.id) return jsonError(403, "forbidden");

    return NextResponse.json({ map });
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

    const [map] = await db
      .select()
      .from(schema.maps)
      .where(eq(schema.maps.id, id))
      .limit(1);
    if (!map) return jsonError(404, "map not found");

    if (map.projectId) {
      const access = await requireProjectAccess(map.projectId, user.id);
      if (access.role === "viewer") return jsonError(403, "forbidden");
    } else if (map.ownerId !== user.id) {
      return jsonError(403, "forbidden");
    }

    await db.delete(schema.maps).where(eq(schema.maps.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}
