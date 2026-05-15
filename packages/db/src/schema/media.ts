import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./core";

export const media = pgTable(
  "medium",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    ownerId: text("owner_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("medium_project_idx").on(t.projectId),
  }),
);

export const mediaCompounds = pgTable(
  "medium_compound",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediumId: uuid("medium_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    compoundId: text("compound_id").notNull(),
    compoundNamespace: text("compound_namespace").notNull(),
    concentration: doublePrecision("concentration"),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    byMedium: index("medium_compound_medium_idx").on(t.mediumId),
  }),
);
