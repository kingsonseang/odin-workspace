import type { ProjectStatus, TaskStatus } from "@forgeboard/shared";
import { isProjectLead, isProjectMember } from "./access";
import type { Activity, Project, Task, User } from "./entities";
import { DomainError } from "./errors";
import type {
  ActivityRepository,
  Clock,
  IdGenerator,
  ProjectRepository,
  TaskRepository,
  UserRepository
} from "./ports";
import {
  getAvailableProjectTransitions,
  getAvailableTaskTransitions,
  hasOpenTasks
} from "./workflow";
import {
  buildProjectDetailView,
  buildProjectSummaryView,
  type ProjectDetailView,
  type ProjectSummaryView
} from "./views";

interface ProjectServiceDependencies {
  projects: ProjectRepository;
  tasks: TaskRepository;
  users: UserRepository;
  activities: ActivityRepository;
}

export class ProjectService {
  constructor(
    private readonly repositories: ProjectServiceDependencies,
    private readonly clock: Clock,
    private readonly generateId: IdGenerator
  ) {}

  listProjects(
    actorId: string,
    options: { includeArchived: boolean }
  ): ProjectSummaryView[] {
    this.requireUser(actorId);
    const users = this.repositories.users.list();

    return this.repositories.projects
      .list()
      .filter(
        (project) =>
          options.includeArchived || project.archivedAt === null
      )
      .map((project) =>
        buildProjectSummaryView(
          project,
          this.repositories.tasks.listByProject(project.id),
          users
        )
      );
  }

  getProject(projectId: string, actorId: string): ProjectDetailView {
    this.requireUser(actorId);
    const project = this.requireProject(projectId);
    return this.toDetail(project, actorId);
  }

  changeStatus(
    projectId: string,
    actorId: string,
    nextStatus: ProjectStatus
  ): ProjectDetailView {
    this.requireUser(actorId);
    const project = this.requireProject(projectId);
    this.requireLead(project, actorId);

    if (project.archivedAt !== null) {
      throw new DomainError(
        "PROJECT_ARCHIVED",
        "Restore the project before changing its status."
      );
    }

    const tasks = this.repositories.tasks.listByProject(project.id);
    if (
      nextStatus === "completed" &&
      hasOpenTasks(tasks) &&
      project.status !== "completed"
    ) {
      throw new DomainError(
        "OPEN_TASKS_REMAIN",
        "All open tasks must be finished or cancelled before the project can be completed."
      );
    }

    const allowed = getAvailableProjectTransitions(project, tasks);
    if (!allowed.includes(nextStatus)) {
      throw new DomainError(
        "INVALID_PROJECT_TRANSITION",
        `A ${project.status} project cannot move directly to ${nextStatus}.`,
        { from: project.status, to: nextStatus }
      );
    }

    const now = this.clock().toISOString();
    const updated: Project = {
      ...project,
      status: nextStatus,
      updatedAt: now
    };
    this.repositories.projects.save(updated);

    const activity: Activity = {
      id: this.generateId("act"),
      projectId: project.id,
      actorId,
      createdAt: now,
      kind: "project.status_changed",
      from: project.status,
      to: nextStatus
    };
    this.repositories.activities.append(activity);

    return this.toDetail(updated, actorId);
  }

  archiveProject(projectId: string, actorId: string): ProjectDetailView {
    this.requireUser(actorId);
    const project = this.requireProject(projectId);
    this.requireLead(project, actorId);

    if (project.archivedAt !== null) {
      throw new DomainError(
        "PROJECT_ALREADY_ARCHIVED",
        "This project is already archived."
      );
    }

    const tasks = this.repositories.tasks.listByProject(project.id);
    if (project.status !== "completed") {
      throw new DomainError(
        "PROJECT_NOT_ELIGIBLE_FOR_ARCHIVE",
        "Only completed projects can be archived."
      );
    }

    if (hasOpenTasks(tasks)) {
      throw new DomainError(
        "OPEN_TASKS_REMAIN",
        "Finish or cancel open tasks before archiving this project."
      );
    }

    const now = this.clock().toISOString();
    const updated: Project = {
      ...project,
      archivedAt: now,
      updatedAt: now
    };
    this.repositories.projects.save(updated);
    this.repositories.activities.append({
      id: this.generateId("act"),
      projectId: project.id,
      actorId,
      createdAt: now,
      kind: "project.archived"
    });

    return this.toDetail(updated, actorId);
  }

  restoreProject(projectId: string, actorId: string): ProjectDetailView {
    this.requireUser(actorId);
    const project = this.requireProject(projectId);
    this.requireLead(project, actorId);

    if (project.archivedAt === null) {
      throw new DomainError(
        "PROJECT_NOT_ARCHIVED",
        "This project is not archived."
      );
    }

    const now = this.clock().toISOString();
    const updated: Project = {
      ...project,
      archivedAt: null,
      updatedAt: now
    };
    this.repositories.projects.save(updated);
    this.repositories.activities.append({
      id: this.generateId("act"),
      projectId: project.id,
      actorId,
      createdAt: now,
      kind: "project.restored"
    });

    return this.toDetail(updated, actorId);
  }

  private toDetail(project: Project, actorId: string): ProjectDetailView {
    return buildProjectDetailView(
      project,
      this.repositories.tasks.listByProject(project.id),
      this.repositories.activities.listByProject(project.id),
      this.repositories.users.list(),
      actorId
    );
  }

  private requireUser(actorId: string): User {
    const user = this.repositories.users.findById(actorId);
    if (!user) {
      throw new DomainError("USER_NOT_FOUND", "The selected user does not exist.");
    }
    return user;
  }

  private requireProject(projectId: string): Project {
    const project = this.repositories.projects.findById(projectId);
    if (!project) {
      throw new DomainError("PROJECT_NOT_FOUND", "Project not found.");
    }
    return project;
  }

  private requireLead(project: Project, actorId: string): void {
    if (!isProjectLead(project, actorId)) {
      throw new DomainError(
        "FORBIDDEN_PROJECT_MANAGE",
        "Only the project lead can manage this project."
      );
    }
  }
}

export interface CreateTaskInput {
  title: string;
  description: string;
  estimate: number;
  assigneeId: string | null;
}

export class TaskService {
  constructor(
    private readonly repositories: ProjectServiceDependencies,
    private readonly clock: Clock,
    private readonly generateId: IdGenerator
  ) {}

  createTask(
    projectId: string,
    actorId: string,
    input: CreateTaskInput
  ): Task {
    this.requireUser(actorId);
    const project = this.requireProject(projectId);
    this.requireContributor(project, actorId);
    this.assertProjectAcceptsWork(project);

    const title = input.title.trim();
    const description = input.description.trim();
    if (
      title.length === 0 ||
      !Number.isInteger(input.estimate) ||
      input.estimate <= 0
    ) {
      throw new DomainError(
        "INVALID_TASK_INPUT",
        "A task needs a title and a positive whole-number estimate."
      );
    }

    if (
      input.assigneeId !== null &&
      !project.memberIds.includes(input.assigneeId)
    ) {
      throw new DomainError(
        "INVALID_ASSIGNEE",
        "Tasks can only be assigned to members of the project."
      );
    }

    const now = this.clock().toISOString();
    const task: Task = {
      id: this.generateId("tsk"),
      projectId: project.id,
      title,
      description,
      estimate: input.estimate,
      status: "todo",
      assigneeId: input.assigneeId,
      createdAt: now,
      updatedAt: now
    };
    this.repositories.tasks.save(task);
    this.repositories.activities.append({
      id: this.generateId("act"),
      projectId: project.id,
      actorId,
      createdAt: now,
      kind: "task.created",
      taskId: task.id
    });

    return task;
  }

  updateTaskStatus(
    taskId: string,
    actorId: string,
    nextStatus: TaskStatus
  ): Task {
    this.requireUser(actorId);
    const task = this.repositories.tasks.findById(taskId);
    if (!task) {
      throw new DomainError("TASK_NOT_FOUND", "Task not found.");
    }

    const project = this.requireProject(task.projectId);
    this.requireContributor(project, actorId);
    this.assertProjectAcceptsWork(project);

    if (!getAvailableTaskTransitions(task).includes(nextStatus)) {
      throw new DomainError(
        "INVALID_TASK_TRANSITION",
        `A ${task.status} task cannot move directly to ${nextStatus}.`,
        { from: task.status, to: nextStatus }
      );
    }

    const now = this.clock().toISOString();
    const updated: Task = {
      ...task,
      status: nextStatus,
      updatedAt: now
    };
    this.repositories.tasks.save(updated);
    this.repositories.activities.append({
      id: this.generateId("act"),
      projectId: project.id,
      actorId,
      createdAt: now,
      kind: "task.status_changed",
      taskId: task.id,
      from: task.status,
      to: nextStatus
    });

    return updated;
  }

  private requireUser(actorId: string): User {
    const user = this.repositories.users.findById(actorId);
    if (!user) {
      throw new DomainError("USER_NOT_FOUND", "The selected user does not exist.");
    }
    return user;
  }

  private requireProject(projectId: string): Project {
    const project = this.repositories.projects.findById(projectId);
    if (!project) {
      throw new DomainError("PROJECT_NOT_FOUND", "Project not found.");
    }
    return project;
  }

  private requireContributor(project: Project, actorId: string): void {
    if (!isProjectMember(project, actorId)) {
      throw new DomainError(
        "FORBIDDEN_TASK_WRITE",
        "Only project members can change tasks."
      );
    }
  }

  private assertProjectAcceptsWork(project: Project): void {
    if (project.archivedAt !== null) {
      throw new DomainError(
        "PROJECT_ARCHIVED",
        "Restore the project before changing tasks."
      );
    }
    if (project.status === "completed") {
      throw new DomainError(
        "PROJECT_COMPLETED",
        "Reopen the project before changing tasks."
      );
    }
  }
}
