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
import { projects, organisms } from "./core";

export const strains = pgTable(
  "strain",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    parentId: uuid("parent_id"),
    organismId: uuid("organism_id").references(() => organisms.id),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    ownerId: text("owner_id").references(() => users.id),
    genotype: text("genotype"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("strain_project_idx").on(t.projectId),
  }),
);

export const experiments = pgTable(
  "experiment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    ownerId: text("owner_id").references(() => users.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("experiment_project_idx").on(t.projectId),
  }),
);

export const samples = pgTable(
  "sample",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    experimentId: uuid("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    strainId: uuid("strain_id").references(() => strains.id),
    name: text("name").notNull(),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    byExperiment: index("sample_experiment_idx").on(t.experimentId),
  }),
);

export const measurements = pgTable(
  "measurement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sampleId: uuid("sample_id")
      .notNull()
      .references(() => samples.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["fermentation", "proteomics", "metabolomics", "fluxomics"],
    }).notNull(),
    target: text("target").notNull(),
    targetNamespace: text("target_namespace"),
    value: doublePrecision("value").notNull(),
    unit: text("unit"),
    time: doublePrecision("time"),
    metadata: jsonb("metadata"),
  },
  (t) => ({
    bySample: index("measurement_sample_idx").on(t.sampleId),
    byType: index("measurement_type_idx").on(t.type),
  }),
);
