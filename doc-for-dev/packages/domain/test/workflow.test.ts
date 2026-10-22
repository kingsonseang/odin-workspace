import { describe, expect, it } from "vitest";
import {
  getArchiveEligibility,
  getAvailableProjectTransitions,
  getAvailableTaskTransitions,
  hasOpenTasks
} from "@forgeboard/domain";
import { makeProject, makeTask } from "./fixtures";

describe("project workflow", () => {
  it("prevents completing a project while work is still open", () => {
    const project = makeProject({ status: "active" });
    const tasks = [
      makeTask({ id: "one", status: "done", estimate: 3 }),
      makeTask({ id: "two", status: "todo", estimate: 5 })
    ];

    expect(getAvailableProjectTransitions(project, tasks)).toEqual([
      "paused"
    ]);
    expect(hasOpenTasks(tasks)).toBe(true);
  });

  it("allows completion once actionable tasks are done or cancelled", () => {
    const project = makeProject({ status: "active" });
    const tasks = [
      makeTask({ id: "one", status: "done", estimate: 3 }),
      makeTask({ id: "two", status: "cancelled", estimate: 5 })
    ];

    expect(getAvailableProjectTransitions(project, tasks)).toEqual([
      "paused",
      "completed"
    ]);
  });

  it("does not expose transitions for archived projects", () => {
    const project = makeProject({
      status: "completed",
      archivedAt: "2026-02-01T00:00:00.000Z"
    });

    expect(getAvailableProjectTransitions(project, [])).toEqual([]);
  });

  it("allows archiving only after completion with no open tasks", () => {
    const activeProject = makeProject({ status: "active" });
    const completedProject = makeProject({ status: "completed" });
    const openTask = makeTask({ status: "in_progress" });

    expect(getArchiveEligibility(activeProject, []).reason).toBe(
      "NOT_COMPLETED"
    );
    expect(getArchiveEligibility(completedProject, [openTask]).reason).toBe(
      "OPEN_TASKS"
    );
    expect(getArchiveEligibility(completedProject, []).eligible).toBe(true);
  });
});

describe("task workflow", () => {
  it("defines explicit transitions for each task state", () => {
    expect(getAvailableTaskTransitions(makeTask({ status: "todo" }))).toEqual([
      "in_progress",
      "cancelled"
    ]);
    expect(
      getAvailableTaskTransitions(makeTask({ status: "in_progress" }))
    ).toEqual(["todo", "done", "cancelled"]);
    expect(getAvailableTaskTransitions(makeTask({ status: "done" }))).toEqual([
      "in_progress"
    ]);
    expect(
      getAvailableTaskTransitions(makeTask({ status: "cancelled" }))
    ).toEqual(["todo"]);
  });
});
