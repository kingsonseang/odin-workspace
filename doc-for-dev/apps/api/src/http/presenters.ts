import type {
  ActivityView,
  ProjectDetailView,
  ProjectSummaryView,
  TaskView,
  User
} from "@forgeboard/domain";
import type {
  ActivityDto,
  ProjectDetailDto,
  ProjectSummaryDto,
  TaskDto,
  UserDto
} from "@forgeboard/shared";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    title: user.title
  };
}

export function toProjectSummaryDto(
  view: ProjectSummaryView
): ProjectSummaryDto {
  return {
    id: view.project.id,
    key: view.project.key,
    name: view.project.name,
    description: view.project.description,
    status: view.project.status,
    lead: toUserDto(view.lead),
    memberCount: view.memberCount,
    progress: {
      percent: view.progress.percent,
      completedPoints: view.progress.completedPoints,
      totalPoints: view.progress.totalPoints
    },
    taskCounts: { ...view.progress.counts },
    archivedAt: view.project.archivedAt
  };
}

export function toTaskDto(view: TaskView): TaskDto {
  return {
    id: view.task.id,
    projectId: view.task.projectId,
    title: view.task.title,
    description: view.task.description,
    estimate: view.task.estimate,
    status: view.task.status,
    assignee: view.assignee === null ? null : toUserDto(view.assignee),
    createdAt: view.task.createdAt,
    updatedAt: view.task.updatedAt,
    allowedStatusTransitions: [...view.allowedStatusTransitions]
  };
}

export function toActivityDto(view: ActivityView): ActivityDto {
  const { activity } = view;
  const base = {
    id: activity.id,
    actor: toUserDto(view.actor),
    createdAt: activity.createdAt
  };

  switch (activity.kind) {
    case "project.status_changed":
      return {
        ...base,
        kind: activity.kind,
        from: activity.from,
        to: activity.to
      };
    case "project.archived":
    case "project.restored":
      return {
        ...base,
        kind: activity.kind
      };
    case "task.created":
      return {
        ...base,
        kind: activity.kind,
        task: {
          id: activity.taskId,
          title: view.taskTitle ?? "Removed task"
        }
      };
    case "task.status_changed":
      return {
        ...base,
        kind: activity.kind,
        task: {
          id: activity.taskId,
          title: view.taskTitle ?? "Removed task"
        },
        from: activity.from,
        to: activity.to
      };
  }
}

export function toProjectDetailDto(
  view: ProjectDetailView
): ProjectDetailDto {
  return {
    ...toProjectSummaryDto(view),
    members: view.members.map(toUserDto),
    tasks: view.tasks.map(toTaskDto),
    activity: view.activity.map(toActivityDto),
    capabilities: {
      canManageProject: view.capabilities.manageProject,
      canCreateTask: view.capabilities.createTask,
      canUpdateTasks: view.capabilities.updateTasks,
      canArchive: view.capabilities.archive,
      canRestore: view.capabilities.restore
    },
    availableProjectTransitions: [...view.availableProjectTransitions]
  };
}
