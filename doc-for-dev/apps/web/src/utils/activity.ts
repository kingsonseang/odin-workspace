import type { ActivityDto } from "@forgeboard/shared";
import {
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS
} from "@forgeboard/shared";

export function describeActivity(activity: ActivityDto): string {
  switch (activity.kind) {
    case "project.status_changed":
      return `moved the project from ${PROJECT_STATUS_LABELS[activity.from]} to ${PROJECT_STATUS_LABELS[activity.to]}`;
    case "project.archived":
      return "archived the project";
    case "project.restored":
      return "restored the project";
    case "task.created":
      return `created “${activity.task.title}”`;
    case "task.status_changed":
      return `moved “${activity.task.title}” from ${TASK_STATUS_LABELS[activity.from]} to ${TASK_STATUS_LABELS[activity.to]}`;
  }
}
