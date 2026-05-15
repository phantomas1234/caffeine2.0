import { describe, it, expect, vi, afterEach } from "vitest";
import { api } from "./api-client";

afterEach(() => vi.unstubAllGlobals());

function mockJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("api client", () => {
  it("listProjects GETs /api/projects", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      mockJson({ projects: [{ id: "p1" }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await api.listProjects();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({
        headers: expect.objectContaining({ "content-type": "application/json" }),
      }),
    );
    expect(data.projects[0].id).toBe("p1");
  });

  it("createProject POSTs JSON", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => mockJson({ project: { id: "p1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await api.createProject({ name: "x" });
    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: "x" }));
  });

  it("listModels appends projectId when given", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => mockJson({ models: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await api.listModels("p1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/models?projectId=p1",
      expect.any(Object),
    );
  });

  it("throws on non-2xx with the server error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockJson({ error: "forbidden" }, 403)),
    );
    await expect(api.listProjects()).rejects.toThrow("forbidden");
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    await expect(api.deleteProject("p1")).resolves.toBeUndefined();
  });
});
