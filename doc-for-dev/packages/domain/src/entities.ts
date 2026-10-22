import type { ProjectStatus, TaskStatus } from "@forgeboard/shared";

export interface User {
  id: string;
  name: string;
  title: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  leadId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  estimate: number;
  status: TaskStatus;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActivityBase {
  id: string;
  projectId: string;
  actorId: string;
  createdAt: string;
}

export type Activity =
  | (ActivityBase & {
      kind: "project.status_changed";
      from: ProjectStatus;
      to: ProjectStatus;
    })
  | (ActivityBase & {
      kind: "project.archived" | "project.restored";
    })
  | (ActivityBase & {
      kind: "task.created";
      taskId: string;
    })
  | (ActivityBase & {
      kind: "task.status_changed";
      taskId: string;
      from: TaskStatus;
      to: TaskStatus;
    });

export type ActivityKind = Activity["kind"];
