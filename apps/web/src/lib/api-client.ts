async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  role: "owner" | "editor" | "viewer";
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ModelMetadata = {
  reactionCount?: number;
  metaboliteCount?: number;
  geneCount?: number;
  compartments?: string[];
};

export type Model = {
  id: string;
  name: string;
  description: string | null;
  projectId: string | null;
  ownerId: string | null;
  organismId: string | null;
  isPublic: boolean;
  sbmlObjectKey: string;
  metadata: ModelMetadata | null;
  createdAt: string;
  updatedAt: string;
};

export type MapSummary = {
  id: string;
  name: string;
  modelId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EscherMapDocument = MapSummary & {
  ownerId: string | null;
  isPublic: boolean;
  escher: unknown;
};

export const api = {
  listProjects: () =>
    request<{ projects: ProjectSummary[] }>("/api/projects"),
  createProject: (data: { name: string; description?: string }) =>
    request<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProject: (id: string) =>
    request<{ project: Project; role: "owner" | "editor" | "viewer" }>(
      `/api/projects/${id}`,
    ),
  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: "DELETE" }),

  listModels: (projectId?: string) =>
    request<{ models: Model[] }>(
      projectId ? `/api/models?projectId=${projectId}` : "/api/models",
    ),
  getModel: (id: string) =>
    request<{ model: Model; downloadUrl: string }>(`/api/models/${id}`),
  deleteModel: (id: string) =>
    request<void>(`/api/models/${id}`, { method: "DELETE" }),

  getUploadUrl: (data: { filename: string; contentType: string }) =>
    request<{ key: string; url: string; expiresIn: number }>(
      "/api/models/upload-url",
      { method: "POST", body: JSON.stringify(data) },
    ),
  createModel: (data: {
    name: string;
    description?: string;
    projectId: string;
    objectKey: string;
  }) =>
    request<{ model: Model }>("/api/models", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listMaps: (opts?: { projectId?: string; modelId?: string }) => {
    const params = new URLSearchParams();
    if (opts?.projectId) params.set("projectId", opts.projectId);
    if (opts?.modelId) params.set("modelId", opts.modelId);
    const qs = params.toString();
    return request<{ maps: MapSummary[] }>(
      qs ? `/api/maps?${qs}` : "/api/maps",
    );
  },
  getMap: (id: string) =>
    request<{ map: EscherMapDocument }>(`/api/maps/${id}`),
  deleteMap: (id: string) =>
    request<void>(`/api/maps/${id}`, { method: "DELETE" }),
  createMap: (data: {
    name: string;
    projectId: string;
    modelId?: string;
    escher: unknown;
  }) =>
    request<{ map: MapSummary }>("/api/maps", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
