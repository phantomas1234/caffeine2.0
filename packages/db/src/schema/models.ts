import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects, organisms } from "./core";

export const models = pgTable(
  "model",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    organismId: uuid("organism_id").references(() => organisms.id),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    ownerId: text("owner_id").references(() => users.id),
    isPublic: boolean("is_public").notNull().default(false),
    sbmlObjectKey: text("sbml_object_key").notNull(),
    metadata: jsonb("metadata").$type<{
      reactionCount?: number;
      metaboliteCount?: number;
      geneCount?: number;
      compartments?: string[];
    }>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("model_project_idx").on(t.projectId),
    byOwner: index("model_owner_idx").on(t.ownerId),
  }),
);
