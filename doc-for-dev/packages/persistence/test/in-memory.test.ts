import { describe, expect, it } from "vitest";
import {
  createInMemoryRepositories,
  createSeedData
} from "@forgeboard/persistence";

describe("in-memory repositories", () => {
  it("does not expose stored entities by reference", () => {
    const repositories = createInMemoryRepositories();
    const project = repositories.projects.findById("prj_checkout");
    expect(project).not.toBeNull();

    project!.name = "Mutated outside the repository";
    expect(repositories.projects.findById("prj_checkout")?.name).toBe(
      "Checkout recovery"
    );

    repositories.projects.save(project!);
    expect(repositories.projects.findById("prj_checkout")?.name).toBe(
      "Mutated outside the repository"
    );
  });

  it("scopes tasks and activities to their project", () => {
    const repositories = createInMemoryRepositories();

    expect(repositories.tasks.listByProject("prj_checkout")).toHaveLength(6);
    expect(repositories.tasks.listByProject("prj_push")).toHaveLength(4);
    expect(
      repositories.activities
        .listByProject("prj_billing")
        .every((activity) => activity.projectId === "prj_billing")
    ).toBe(true);
  });
});

describe("seed data integrity", () => {
  it("uses real users and project members throughout", () => {
    const seed = createSeedData();
    const userIds = new Set(seed.users.map((user) => user.id));
    const projects = new Map(seed.projects.map((project) => [project.id, project]));

    for (const project of seed.projects) {
      expect(userIds.has(project.leadId)).toBe(true);
      expect(project.memberIds).toContain(project.leadId);
      for (const memberId of project.memberIds) {
        expect(userIds.has(memberId)).toBe(true);
      }
    }

    for (const task of seed.tasks) {
      const project = projects.get(task.projectId);
      expect(project).toBeDefined();
      if (task.assigneeId !== null) {
        expect(project?.memberIds).toContain(task.assigneeId);
      }
    }

    for (const activity of seed.activities) {
      expect(userIds.has(activity.actorId)).toBe(true);
      expect(projects.has(activity.projectId)).toBe(true);
      if ("taskId" in activity) {
        const task = seed.tasks.find((candidate) => candidate.id === activity.taskId);
        expect(task?.projectId).toBe(activity.projectId);
      }
    }
  });
});
