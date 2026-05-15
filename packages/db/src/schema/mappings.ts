import { pgTable, text, uuid, index, unique } from "drizzle-orm/pg-core";

export const idMappings = pgTable(
  "id_mapping",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceNamespace: text("source_namespace").notNull(),
    sourceId: text("source_id").notNull(),
    targetNamespace: text("target_namespace").notNull(),
    targetId: text("target_id").notNull(),
    entityType: text("entity_type", {
      enum: ["metabolite", "reaction", "gene"],
    }).notNull(),
  },
  (t) => ({
    bySource: index("id_mapping_source_idx").on(
      t.sourceNamespace,
      t.sourceId,
      t.entityType,
    ),
    byTarget: index("id_mapping_target_idx").on(
      t.targetNamespace,
      t.targetId,
      t.entityType,
    ),
    uniq: unique("id_mapping_uniq").on(
      t.sourceNamespace,
      t.sourceId,
      t.targetNamespace,
      t.targetId,
      t.entityType,
    ),
  }),
);
