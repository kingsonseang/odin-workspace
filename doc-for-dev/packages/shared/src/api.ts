import type { ProjectStatus, TaskStatus } from "./vocabulary";

export interface UserDto {
  id: string;
  name: string;
  title: string;
}

export interface TaskCountsDto {
  total: number;
  open: number;
  done: number;
  cancelled: number;
}

export interface ProgressDto {
  percent: number;
  completedPoints: number;
  totalPoints: number;
}

export interface ProjectSummaryDto {
  id: string;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  lead: UserDto;
  memberCount: number;
  progress: ProgressDto;
  taskCounts: TaskCountsDto;
  archivedAt: string | null;
}

export interface ProjectCapabilitiesDto {
  canManageProject: boolean;
  canCreateTask: boolean;
  canUpdateTasks: boolean;
  canArchive: boolean;
  canRestore: boolean;
}

export interface TaskDto {
  id: string;
  projectId: string;
  title: string;
  description: string;
  estimate: number;
  status: TaskStatus;
  assignee: UserDto | null;
  createdAt: string;
  updatedAt: string;
  allowedStatusTransitions: TaskStatus[];
}

interface ActivityBaseDto {
  id: string;
  actor: UserDto;
  createdAt: string;
}

export type ActivityDto =
  | (ActivityBaseDto & {
      kind: "project.status_changed";
      from: ProjectStatus;
      to: ProjectStatus;
    })
  | (ActivityBaseDto & {
      kind: "project.archived" | "project.restored";
    })
  | (ActivityBaseDto & {
      kind: "task.created";
      task: { id: string; title: string };
    })
  | (ActivityBaseDto & {
      kind: "task.status_changed";
      task: { id: string; title: string };
      from: TaskStatus;
      to: TaskStatus;
    });

export interface ProjectDetailDto extends ProjectSummaryDto {
  members: UserDto[];
  tasks: TaskDto[];
  activity: ActivityDto[];
  capabilities: ProjectCapabilitiesDto;
  availableProjectTransitions: ProjectStatus[];
}

export interface HealthResponseDto {
  status: "ok";
  storage: "memory";
}

export interface UsersResponseDto {
  users: UserDto[];
}

export interface ProjectsResponseDto {
  projects: ProjectSummaryDto[];
}

export interface ProjectResponseDto {
  project: ProjectDetailDto;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  estimate: number;
  assigneeId?: string | null;
}

export interface UpdateProjectStatusRequest {
  status: ProjectStatus;
}

export interface UpdateTaskRequest {
  status: TaskStatus;
}
