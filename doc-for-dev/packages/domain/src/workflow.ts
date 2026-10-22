import type { ProjectStatus, TaskStatus } from "@forgeboard/shared";
import type { Project, Task } from "./entities";
import { isOpenTaskStatus } from "./task-status";

const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planning: ["active"],
  active: ["paused", "completed"],
  paused: ["active", "completed"],
  completed: ["active"]
};

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["in_progress", "cancelled"],
  in_progress: ["todo", "done", "cancelled"],
  done: ["in_progress"],
  cancelled: ["todo"]
};

export type ArchiveBlockReason =
  | "ALREADY_ARCHIVED"
  | "NOT_COMPLETED"
  | "OPEN_TASKS";

export interface ArchiveEligibility {
  eligible: boolean;
  reason: ArchiveBlockReason | null;
}

export function hasOpenTasks(tasks: Task[]): boolean {
  return tasks.some((task) => isOpenTaskStatus(task.status));
}

export function getAvailableProjectTransitions(
  project: Project,
  tasks: Task[]
): ProjectStatus[] {
  if (project.archivedAt !== null) {
    return [];
  }

  const openTasksRemain = hasOpenTasks(tasks);

  return PROJECT_TRANSITIONS[project.status].filter(
    (status) => status !== "completed" || !openTasksRemain
  );
}

export function getAvailableTaskTransitions(task: Task): TaskStatus[] {
  return [...TASK_TRANSITIONS[task.status]];
}

export function getArchiveEligibility(
  project: Project,
  tasks: Task[]
): ArchiveEligibility {
  if (project.archivedAt !== null) {
    return { eligible: false, reason: "ALREADY_ARCHIVED" };
  }

  if (project.status !== "completed") {
    return { eligible: false, reason: "NOT_COMPLETED" };
  }

  if (hasOpenTasks(tasks)) {
    return { eligible: false, reason: "OPEN_TASKS" };
  }

  return { eligible: true, reason: null };
}
