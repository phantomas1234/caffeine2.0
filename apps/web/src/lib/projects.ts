import { and, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { ForbiddenError, NotFoundError } from "./errors";

export { ForbiddenError, NotFoundError };

export async function requireProjectAccess(
  projectId: string,
  userId: string,
): Promise<{ role: "owner" | "editor" | "viewer" }> {
  const rows = await db
    .select({ role: schema.projectMemberships.role })
    .from(schema.projectMemberships)
    .where(
      and(
        eq(schema.projectMemberships.projectId, projectId),
        eq(schema.projectMemberships.userId, userId),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    const exists = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);
    if (exists.length === 0) throw new NotFoundError("project");
    throw new ForbiddenError();
  }

  return { role: rows[0].role as "owner" | "editor" | "viewer" };
}

export async function listUserProjects(userId: string) {
  return db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
      description: schema.projects.description,
      role: schema.projectMemberships.role,
      createdAt: schema.projects.createdAt,
      updatedAt: schema.projects.updatedAt,
    })
    .from(schema.projectMemberships)
    .innerJoin(
      schema.projects,
      eq(schema.projectMemberships.projectId, schema.projects.id),
    )
    .where(eq(schema.projectMemberships.userId, userId));
}
