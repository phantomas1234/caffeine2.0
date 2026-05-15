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
import { projects } from "./core";
import { models } from "./models";

export const maps = pgTable(
  "map",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    modelId: uuid("model_id").references(() => models.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    ownerId: text("owner_id").references(() => users.id),
    isPublic: boolean("is_public").notNull().default(false),
    escher: jsonb("escher").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("map_project_idx").on(t.projectId),
    byModel: index("map_model_idx").on(t.modelId),
  }),
);
