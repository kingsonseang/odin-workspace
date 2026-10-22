import type { Project, Task } from "@forgeboard/domain";

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "prj_test",
    key: "TEST",
    name: "Test project",
    description: "A project used in unit tests.",
    status: "active",
    leadId: "usr_lead",
    memberIds: ["usr_lead", "usr_member"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    archivedAt: null,
    ...overrides
  };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "tsk_test",
    projectId: "prj_test",
    title: "A test task",
    description: "A task used in unit tests.",
    estimate: 3,
    status: "todo",
    assigneeId: "usr_member",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides
  };
}
