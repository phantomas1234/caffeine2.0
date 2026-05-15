import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError, jsonError } from "@/lib/http";
import { requireProjectAccess, ForbiddenError, NotFoundError } from "@/lib/projects";
import { presignDownload } from "@/lib/storage";
import { parseSbml, ModelParserError } from "@/lib/model-parser";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid(),
  objectKey: z.string().min(1).max(500),
  organismId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;

    if (projectId) {
      await requireProjectAccess(projectId, user.id);
      const models = await db
        .select()
        .from(schema.models)
        .where(eq(schema.models.projectId, projectId))
        .orderBy(desc(schema.models.createdAt));
      return NextResponse.json({ models });
    }

    // No projectId: return every model in any project the user belongs to.
    const memberships = await db
      .select({ projectId: schema.projectMemberships.projectId })
      .from(schema.projectMemberships)
      .where(eq(schema.projectMemberships.userId, user.id));
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) return NextResponse.json({ models: [] });

    const models = await db
      .select()
      .from(schema.models)
      .where(
        or(
          inArray(schema.models.projectId, projectIds),
          eq(schema.models.ownerId, user.id),
        ),
      )
      .orderBy(desc(schema.models.createdAt));
    return NextResponse.json({ models });
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

    // Validate + extract metadata by handing the parser a presigned download.
    const downloadUrl = await presignDownload(body.objectKey);
    const parseResult = await parseSbml(downloadUrl);
    if (!parseResult.valid) {
      return jsonError(
        422,
        "SBML validation failed",
        parseResult.errors,
      );
    }

    const [model] = await db
      .insert(schema.models)
      .values({
        name: body.name,
        description: body.description,
        projectId: body.projectId,
        ownerId: user.id,
        organismId: body.organismId,
        sbmlObjectKey: body.objectKey,
        metadata: {
          reactionCount: parseResult.reaction_count,
          metaboliteCount: parseResult.metabolite_count,
          geneCount: parseResult.gene_count,
          compartments: parseResult.compartments,
        },
      })
      .returning();

    return NextResponse.json({ model }, { status: 201 });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(404, err.message);
    if (err instanceof ForbiddenError) return jsonError(403, "forbidden");
    if (err instanceof ModelParserError) return jsonError(502, err.message);
    return handleError(err);
  }
}
