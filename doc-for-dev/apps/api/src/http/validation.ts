import type { ProjectStatus, TaskStatus } from "@forgeboard/shared";
import { isProjectStatus, isTaskStatus } from "@forgeboard/shared";
import type { CreateTaskInput } from "@forgeboard/domain";
import { HttpError } from "./errors";

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new HttpError(
      400,
      "INVALID_BODY",
      "The request body must be a JSON object."
    );
  }
  return value as Record<string, unknown>;
}

export function parseIncludeArchived(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  throw new HttpError(
    400,
    "INVALID_QUERY",
    "includeArchived must be true, false, 1, or 0."
  );
}

export function parseProjectStatusBody(body: unknown): ProjectStatus {
  const value = asObject(body).status;
  if (!isProjectStatus(value)) {
    throw new HttpError(
      400,
      "INVALID_PROJECT_STATUS",
      "Choose a valid project status."
    );
  }
  return value;
}

export function parseTaskStatusBody(body: unknown): TaskStatus {
  const value = asObject(body).status;
  if (!isTaskStatus(value)) {
    throw new HttpError(
      400,
      "INVALID_TASK_STATUS",
      "Choose a valid task status."
    );
  }
  return value;
}

export function parseCreateTaskBody(body: unknown): CreateTaskInput {
  const value = asObject(body);

  if (typeof value.title !== "string") {
    throw new HttpError(400, "INVALID_TASK_TITLE", "A task title is required.");
  }
  const title = value.title.trim();
  if (title.length === 0 || title.length > 120) {
    throw new HttpError(
      400,
      "INVALID_TASK_TITLE",
      "Task titles must be between 1 and 120 characters."
    );
  }

  const description =
    value.description === undefined ? "" : value.description;
  if (typeof description !== "string" || description.length > 500) {
    throw new HttpError(
      400,
      "INVALID_TASK_DESCRIPTION",
      "Task descriptions must be 500 characters or fewer."
    );
  }

  if (
    typeof value.estimate !== "number" ||
    !Number.isInteger(value.estimate) ||
    value.estimate < 1 ||
    value.estimate > 21
  ) {
    throw new HttpError(
      400,
      "INVALID_TASK_ESTIMATE",
      "Estimate must be a whole number between 1 and 21."
    );
  }

  const assigneeId = value.assigneeId === undefined ? null : value.assigneeId;
  if (assigneeId !== null && typeof assigneeId !== "string") {
    throw new HttpError(
      400,
      "INVALID_ASSIGNEE",
      "assigneeId must be a user id or null."
    );
  }
  if (assigneeId === "") {
    throw new HttpError(
      400,
      "INVALID_ASSIGNEE",
      "assigneeId cannot be an empty string."
    );
  }

  return {
    title,
    description: description.trim(),
    estimate: value.estimate,
    assigneeId
  };
}
