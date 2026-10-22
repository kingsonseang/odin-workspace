import type { Task } from "./entities";
import { isOpenTaskStatus } from "./task-status";

export interface TaskCounts {
  total: number;
  open: number;
  done: number;
  cancelled: number;
}

export interface ProgressSummary {
  percent: number;
  completedPoints: number;
  totalPoints: number;
  counts: TaskCounts;
}

export function calculateProgress(tasks: Task[]): ProgressSummary {
  let totalPoints = 0;
  let completedPoints = 0;
  const counts: TaskCounts = {
    total: tasks.length,
    open: 0,
    done: 0,
    cancelled: 0
  };

  for (const task of tasks) {
    if (task.status === "cancelled") {
      counts.cancelled += 1;
      continue;
    }

    totalPoints += task.estimate;
    if (task.status === "done") {
      counts.done += 1;
      completedPoints += task.estimate;
    } else if (isOpenTaskStatus(task.status)) {
      counts.open += 1;
    }
  }

  return {
    percent:
      totalPoints === 0
        ? 0
        : Math.round((completedPoints / totalPoints) * 100),
    completedPoints,
    totalPoints,
    counts
  };
}
