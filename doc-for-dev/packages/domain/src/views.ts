import type { ProjectStatus, TaskStatus } from "@forgeboard/shared";
import {
  canArchiveProject,
  canContributeTasks,
  canManageProject,
  canRestoreProject
} from "./access";
import type { Activity, Project, Task, User } from "./entities";
import { DomainError } from "./errors";
import { calculateProgress, type ProgressSummary } from "./progress";
import {
  getAvailableProjectTransitions,
  getAvailableTaskTransitions
} from "./workflow";

export interface ProjectCapabilities {
  manageProject: boolean;
  createTask: boolean;
  updateTasks: boolean;
  archive: boolean;
  restore: boolean;
}

export interface TaskView {
  task: Task;
  assignee: User | null;
  allowedStatusTransitions: TaskStatus[];
}

export interface ActivityView {
  activity: Activity;
  actor: User;
  taskTitle: string | null;
}

export interface ProjectSummaryView {
  project: Project;
  lead: User;
  memberCount: number;
  progress: ProgressSummary;
}

export interface ProjectDetailView extends ProjectSummaryView {
  members: User[];
  tasks: TaskView[];
  activity: ActivityView[];
  capabilities: ProjectCapabilities;
  availableProjectTransitions: ProjectStatus[];
}

function findUser(users: User[], id: string): User {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    throw new DomainError(
      "DATA_INTEGRITY",
      `User ${id} is referenced but does not exist.`
    );
  }
  return user;
}

export function buildProjectSummaryView(
  project: Project,
  tasks: Task[],
  users: User[]
): ProjectSummaryView {
  return {
    project,
    lead: findUser(users, project.leadId),
    memberCount: project.memberIds.length,
    progress: calculateProgress(tasks)
  };
}

export function buildProjectDetailView(
  project: Project,
  tasks: Task[],
  activities: Activity[],
  users: User[],
  actorId: string
): ProjectDetailView {
  const summary = buildProjectSummaryView(project, tasks, users);
  const capabilities: ProjectCapabilities = {
    manageProject: canManageProject(project, actorId),
    createTask: canContributeTasks(project, actorId),
    updateTasks: canContributeTasks(project, actorId),
    archive: canArchiveProject(project, tasks, actorId),
    restore: canRestoreProject(project, actorId)
  };

  const members = project.memberIds.map((id) => findUser(users, id));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  const taskViews = tasks.map((task) => ({
    task,
    assignee:
      task.assigneeId === null ? null : findUser(users, task.assigneeId),
    allowedStatusTransitions: capabilities.updateTasks
      ? getAvailableTaskTransitions(task)
      : []
  }));

  const activityViews = [...activities]
    .sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        right.id.localeCompare(left.id)
    )
    .map((activity) => {
      const taskId = "taskId" in activity ? activity.taskId : null;
      return {
        activity,
        actor: findUser(users, activity.actorId),
        taskTitle:
          taskId === null ? null : (tasksById.get(taskId)?.title ?? "Removed task")
      };
    });

  return {
    ...summary,
    members,
    tasks: taskViews,
    activity: activityViews,
    capabilities,
    availableProjectTransitions: capabilities.manageProject
      ? getAvailableProjectTransitions(project, tasks)
      : []
  };
}
