import { describe, it, expect, vi, afterEach } from "vitest";
import { api } from "./api-client";

afterEach(() => vi.unstubAllGlobals());

function mockJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("maps api client", () => {
  it("listMaps with no arg hits /api/maps", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => mockJson({ maps: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await api.listMaps();
    expect(fetchMock).toHaveBeenCalledWith("/api/maps", expect.any(Object));
  });

  it("listMaps with projectId+modelId appends a querystring", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => mockJson({ maps: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await api.listMaps({ projectId: "p1", modelId: "m1" });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain("/api/maps?");
    expect(url).toContain("projectId=p1");
    expect(url).toContain("modelId=m1");
  });

  it("createMap POSTs the escher payload", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      mockJson({ map: { id: "x" } }, 201),
    );
    vi.stubGlobal("fetch", fetchMock);

    const escher = [{ map_name: "demo" }, { reactions: {} }];
    await api.createMap({ name: "demo", projectId: "p1", escher });

    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.escher).toEqual(escher);
    expect(body.projectId).toBe("p1");
  });

  it("getMap returns the parsed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        mockJson({ map: { id: "x", name: "demo", escher: [{}, {}] } }),
      ),
    );
    const { map } = await api.getMap("x");
    expect(map.name).toBe("demo");
  });
});
