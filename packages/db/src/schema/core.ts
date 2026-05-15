import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const projects = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projectMemberships = pgTable(
  "project_membership",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "editor", "viewer"] })
      .notNull()
      .default("viewer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.userId] }),
    byUser: index("project_membership_user_idx").on(t.userId),
  }),
);

export const organisms = pgTable("organism", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ncbiTaxonomyId: integer("ncbi_taxonomy_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
