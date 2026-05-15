import { describe, it, expect } from "vitest";
import { getTableName } from "drizzle-orm";
import * as schema from "./index";

describe("schema", () => {
  it("exports the auth tables required by the Drizzle adapter", () => {
    expect(getTableName(schema.users)).toBe("user");
    expect(getTableName(schema.accounts)).toBe("account");
    expect(getTableName(schema.sessions)).toBe("session");
    expect(getTableName(schema.verificationTokens)).toBe("verificationToken");
  });

  it("exports all domain tables", () => {
    const names = [
      schema.projects,
      schema.projectMemberships,
      schema.organisms,
      schema.models,
      schema.maps,
      schema.designs,
      schema.media,
      schema.mediaCompounds,
      schema.strains,
      schema.experiments,
      schema.samples,
      schema.measurements,
      schema.idMappings,
    ].map(getTableName);

    expect(names).toEqual([
      "project",
      "project_membership",
      "organism",
      "model",
      "map",
      "design",
      "medium",
      "medium_compound",
      "strain",
      "experiment",
      "sample",
      "measurement",
      "id_mapping",
    ]);
  });
});
