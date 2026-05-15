import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/projects";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { isPlausibleEscherMap } from "@/lib/escher-format";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  projectId: z.string().uuid(),
  modelId: z.string().uuid().optional(),
  escher: z.unknown(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
    const modelId = req.nextUrl.searchParams.get("modelId") ?? undefined;

    if (projectId) {
      await requireProjectAccess(projectId, user.id);
      const rows = await db
        .select({
          id: schema.maps.id,
          name: schema.maps.name,
          modelId: schema.maps.modelId,
          projectId: schema.maps.projectId,
          createdAt: schema.maps.createdAt,
          updatedAt: schema.maps.updatedAt,
        })
        .from(schema.maps)
        .where(
          modelId
            ? and(
                eq(schema.maps.projectId, projectId),
                eq(schema.maps.modelId, modelId),
              )
            : eq(schema.maps.projectId, projectId),
        )
        .orderBy(desc(schema.maps.createdAt));
      return NextResponse.json({ maps: rows });
    }

    const memberships = await db
      .select({ projectId: schema.projectMemberships.projectId })
      .from(schema.projectMemberships)
      .where(eq(schema.projectMemberships.userId, user.id));
    const projectIds = memberships.map((m) => m.projectId);
    if (projectIds.length === 0) return NextResponse.json({ maps: [] });

    const rows = await db
      .select({
        id: schema.maps.id,
        name: schema.maps.name,
        modelId: schema.maps.modelId,
        projectId: schema.maps.projectId,
        createdAt: schema.maps.createdAt,
        updatedAt: schema.maps.updatedAt,
      })
      .from(schema.maps)
      .where(
        or(
          inArray(schema.maps.projectId, projectIds),
          eq(schema.maps.ownerId, user.id),
        ),
      )
      .orderBy(desc(schema.maps.createdAt));

    return NextResponse.json({ maps: rows });
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

    if (!isPlausibleEscherMap(body.escher)) {
      return jsonError(422, "not a valid Escher map (expected an array of two objects)");
    }

    const [map] = await db
      .insert(schema.maps)
      .values({
        name: body.name,
        projectId: body.projectId,
        modelId: body.modelId,
        ownerId: user.id,
        escher: body.escher,
      })
      .returning({
        id: schema.maps.id,
        name: schema.maps.name,
        modelId: schema.maps.modelId,
        projectId: schema.maps.projectId,
        createdAt: schema.maps.createdAt,
        updatedAt: schema.maps.updatedAt,
      });

    return NextResponse.json({ map }, { status: 201 });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    return handleError(err);
  }
}

