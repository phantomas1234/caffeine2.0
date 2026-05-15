import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./core";
import { models } from "./models";

export type DesignPayload = {
  geneKnockouts: string[];
  reactionKnockouts: string[];
  reactionUpregulations: { id: string; fold: number }[];
  reactionDownregulations: { id: string; fold: number }[];
  reactionBounds: { id: string; lower?: number; upper?: number }[];
  mediumExchanges: { id: string; lower?: number; upper?: number }[];
};

export const designs = pgTable(
  "design",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    modelId: uuid("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    ownerId: text("owner_id").references(() => users.id),
    design: jsonb("design").$type<DesignPayload>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    byModel: index("design_model_idx").on(t.modelId),
    byProject: index("design_project_idx").on(t.projectId),
  }),
);
