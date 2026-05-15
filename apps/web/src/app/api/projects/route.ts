import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError } from "@/lib/http";
import { listUserProjects } from "@/lib/projects";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await listUserProjects(user.id);
    return NextResponse.json({ projects });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());

    const [project] = await db
      .insert(schema.projects)
      .values({
        name: body.name,
        description: body.description,
        ownerId: user.id,
      })
      .returning();

    await db.insert(schema.projectMemberships).values({
      projectId: project.id,
      userId: user.id,
      role: "owner",
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
