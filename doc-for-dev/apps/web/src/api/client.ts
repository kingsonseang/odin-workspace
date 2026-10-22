import type {
  ApiErrorBody,
  CreateTaskRequest,
  ProjectDetailDto,
  ProjectResponseDto,
  ProjectStatus,
  ProjectsResponseDto,
  TaskStatus,
  UpdateTaskRequest,
  UsersResponseDto
} from "@forgeboard/shared";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  actorId?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };
  if (options.actorId) {
    headers["x-forgeboard-user"] = options.actorId;
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      "Could not reach the Forgeboard API. Check that the API server is running."
    );
  }

  if (!response.ok) {
    let code = "REQUEST_FAILED";
    let message = `The request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as Partial<ApiErrorBody>;
      if (body.error) {
        code = body.error.code;
        message = body.error.message;
      }
    } catch {
      // Preserve the fallback message when the server did not return JSON.
    }
    throw new ApiClientError(response.status, code, message);
  }

  return (await response.json()) as T;
}

export const api = {
  listUsers(signal?: AbortSignal): Promise<UsersResponseDto> {
    return request("/users", { signal });
  },

  listProjects(
    actorId: string,
    options: { includeArchived: boolean },
    signal?: AbortSignal
  ): Promise<ProjectsResponseDto> {
    const query = options.includeArchived ? "?includeArchived=true" : "";
    return request(`/projects${query}`, { actorId, signal });
  },

  getProject(
    actorId: string,
    projectId: string,
    signal?: AbortSignal
  ): Promise<ProjectResponseDto> {
    return request(`/projects/${encodeURIComponent(projectId)}`, {
      actorId,
      signal
    });
  },

  updateProjectStatus(
    actorId: string,
    projectId: string,
    status: ProjectStatus
  ): Promise<ProjectResponseDto> {
    return request(`/projects/${encodeURIComponent(projectId)}/status`, {
      actorId,
      method: "PATCH",
      body: { status }
    });
  },

  archiveProject(
    actorId: string,
    projectId: string
  ): Promise<ProjectResponseDto> {
    return request(`/projects/${encodeURIComponent(projectId)}/archive`, {
      actorId,
      method: "POST"
    });
  },

  restoreProject(
    actorId: string,
    projectId: string
  ): Promise<ProjectResponseDto> {
    return request(`/projects/${encodeURIComponent(projectId)}/restore`, {
      actorId,
      method: "POST"
    });
  },

  createTask(
    actorId: string,
    projectId: string,
    body: CreateTaskRequest
  ): Promise<ProjectResponseDto> {
    return request(`/projects/${encodeURIComponent(projectId)}/tasks`, {
      actorId,
      method: "POST",
      body
    });
  },

  updateTaskStatus(
    actorId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<ProjectResponseDto> {
    const body: UpdateTaskRequest = { status };
    return request(`/tasks/${encodeURIComponent(taskId)}`, {
      actorId,
      method: "PATCH",
      body
    });
  }
};

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export type { ProjectDetailDto };
