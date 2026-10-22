import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ACTOR_HEADER } from "../src/http/actor";

const as = (actorId: string) => ({ [ACTOR_HEADER]: actorId });

describe("Forgeboard HTTP API", () => {
  it("exposes health and the demo user directory", async () => {
    const app = createApp();

    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok", storage: "memory" });

    const users = await request(app).get("/api/users");
    expect(users.status).toBe(200);
    expect(users.body.users).toHaveLength(4);
    expect(users.body.users[0]).toMatchObject({
      id: "usr_ada",
      name: "Ada Park"
    });
  });

  it("requires a known demo actor for project data", async () => {
    const app = createApp();

    const missing = await request(app).get("/api/projects");
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe("MISSING_ACTOR");

    const unknown = await request(app)
      .get("/api/projects")
      .set(as("usr_nobody"));
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe("UNKNOWN_ACTOR");
  });

  it("hides archived projects unless they are requested", async () => {
    const app = createApp();

    const current = await request(app)
      .get("/api/projects")
      .set(as("usr_ada"));
    expect(current.status).toBe(200);
    expect(current.body.projects).toHaveLength(4);
    expect(
      current.body.projects.some(
        (project: { id: string }) => project.id === "prj_tokens"
      )
    ).toBe(false);

    const all = await request(app)
      .get("/api/projects?includeArchived=true")
      .set(as("usr_ada"));
    expect(all.status).toBe(200);
    expect(all.body.projects).toHaveLength(5);
    expect(
      all.body.projects.find(
        (project: { id: string }) => project.id === "prj_tokens"
      ).archivedAt
    ).toBeTruthy();
  });

  it("reports viewer capabilities and server-derived task transitions", async () => {
    const app = createApp();

    const lead = await request(app)
      .get("/api/projects/prj_checkout")
      .set(as("usr_ada"));
    expect(lead.status).toBe(200);
    expect(lead.body.project.capabilities).toMatchObject({
      canManageProject: true,
      canCreateTask: true,
      canUpdateTasks: true
    });
    const wallet = lead.body.project.tasks.find(
      (task: { id: string }) => task.id === "tsk_chk_wallet"
    );
    expect(wallet.allowedStatusTransitions).toEqual([
      "todo",
      "done",
      "cancelled"
    ]);

    const nonMember = await request(app)
      .get("/api/projects/prj_checkout")
      .set(as("usr_diya"));
    expect(nonMember.status).toBe(200);
    expect(nonMember.body.project.capabilities).toMatchObject({
      canManageProject: false,
      canCreateTask: false,
      canUpdateTasks: false
    });
    expect(
      nonMember.body.project.tasks.every(
        (task: { allowedStatusTransitions: string[] }) =>
          task.allowedStatusTransitions.length === 0
      )
    ).toBe(true);
  });

  it("blocks completing a project while open tasks remain", async () => {
    const app = createApp();

    const response = await request(app)
      .patch("/api/projects/prj_checkout/status")
      .set(as("usr_ada"))
      .send({ status: "completed" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OPEN_TASKS_REMAIN");
  });

  it("creates tasks and recalculates weighted progress after completion", async () => {
    const app = createApp();

    const created = await request(app)
      .post("/api/projects/prj_checkout/tasks")
      .set(as("usr_ben"))
      .send({
        title: "Verify recovery telemetry",
        description: "Check the new retry event shape in the warehouse.",
        estimate: 3,
        assigneeId: "usr_ben"
      });

    expect(created.status).toBe(201);
    const createdTask = created.body.project.tasks.find(
      (task: { title: string }) =>
        task.title === "Verify recovery telemetry"
    );
    expect(createdTask).toMatchObject({
      status: "todo",
      estimate: 3,
      assignee: { id: "usr_ben" }
    });
    expect(
      created.body.project.activity.some(
        (entry: { kind: string; task?: { id: string } }) =>
          entry.kind === "task.created" && entry.task?.id === createdTask.id
      )
    ).toBe(true);

    const initialProgress = created.body.project.progress.percent;

    await request(app)
      .patch(`/api/tasks/${createdTask.id}`)
      .set(as("usr_ben"))
      .send({ status: "in_progress" });

    const completed = await request(app)
      .patch(`/api/tasks/${createdTask.id}`)
      .set(as("usr_ben"))
      .send({ status: "done" });

    expect(completed.status).toBe(200);
    expect(completed.body.project.progress.percent).toBeGreaterThan(
      initialProgress
    );
    expect(
      completed.body.project.activity.some(
        (entry: { kind: string; to?: string }) =>
          entry.kind === "task.status_changed" && entry.to === "done"
      )
    ).toBe(true);
  });

  it("rejects task changes from non-members and on completed projects", async () => {
    const app = createApp();

    const outsider = await request(app)
      .post("/api/projects/prj_checkout/tasks")
      .set(as("usr_diya"))
      .send({ title: "Should not be allowed", estimate: 1 });

    expect(outsider.status).toBe(403);
    expect(outsider.body.error.code).toBe("FORBIDDEN_TASK_WRITE");

    const completedProject = await request(app)
      .patch("/api/tasks/tsk_a11y_focus")
      .set(as("usr_ben"))
      .send({ status: "in_progress" });

    expect(completedProject.status).toBe(409);
    expect(completedProject.body.error.code).toBe("PROJECT_COMPLETED");
  });

  it("validates task input before reaching the domain layer", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/projects/prj_checkout/tasks")
      .set(as("usr_ben"))
      .send({ title: "   ", estimate: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_TASK_TITLE");
  });

  it("archives and restores a completed project while preserving activity", async () => {
    const app = createApp();

    const before = await request(app)
      .get("/api/projects/prj_a11y")
      .set(as("usr_ben"));
    expect(before.body.project.capabilities.canArchive).toBe(true);

    const forbidden = await request(app)
      .post("/api/projects/prj_a11y/archive")
      .set(as("usr_ada"));
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN_PROJECT_MANAGE");

    const archived = await request(app)
      .post("/api/projects/prj_a11y/archive")
      .set(as("usr_ben"));
    expect(archived.status).toBe(200);
    expect(archived.body.project.archivedAt).toBeTruthy();
    expect(archived.body.project.capabilities.canRestore).toBe(true);

    const current = await request(app)
      .get("/api/projects")
      .set(as("usr_ben"));
    expect(
      current.body.projects.some(
        (project: { id: string }) => project.id === "prj_a11y"
      )
    ).toBe(false);

    const restored = await request(app)
      .post("/api/projects/prj_a11y/restore")
      .set(as("usr_ben"));
    expect(restored.status).toBe(200);
    expect(restored.body.project.archivedAt).toBeNull();
    expect(
      restored.body.project.activity.some(
        (entry: { kind: string }) => entry.kind === "project.restored"
      )
    ).toBe(true);
  });

  it("rejects task changes on an archived project", async () => {
    const app = createApp();

    const response = await request(app)
      .patch("/api/tasks/tsk_tok_spacing")
      .set(as("usr_ada"))
      .send({ status: "in_progress" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("PROJECT_ARCHIVED");
  });
});
