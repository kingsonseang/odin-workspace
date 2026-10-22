import type { TaskStatus } from "@forgeboard/shared";

export function isOpenTaskStatus(status: TaskStatus): boolean {
  return status === "todo" || status === "in_progress";
}
