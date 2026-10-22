import { describe, expect, it } from "vitest";
import {
  canArchiveProject,
  canContributeTasks,
  canManageProject,
  canRestoreProject
} from "@forgeboard/domain";
import { makeProject, makeTask } from "./fixtures";

describe("project access rules", () => {
  it("limits project management to the lead", () => {
    const project = makeProject();

    expect(canManageProject(project, "usr_lead")).toBe(true);
    expect(canManageProject(project, "usr_member")).toBe(false);
  });

  it("lets members contribute to tasks but not non-members", () => {
    const project = makeProject();

    expect(canContributeTasks(project, "usr_member")).toBe(true);
    expect(canContributeTasks(project, "usr_outsider")).toBe(false);
  });

  it("makes completed and archived projects read-only", () => {
    expect(
      canContributeTasks(makeProject({ status: "completed" }), "usr_member")
    ).toBe(false);
    expect(
      canContributeTasks(
        makeProject({ archivedAt: "2026-02-01T00:00:00.000Z" }),
        "usr_lead"
      )
    ).toBe(false);
  });

  it("only offers archive and restore to the lead in valid states", () => {
    const completed = makeProject({ status: "completed" });
    const archived = makeProject({
      status: "completed",
      archivedAt: "2026-02-01T00:00:00.000Z"
    });
    const task = makeTask({ status: "done" });

    expect(canArchiveProject(completed, [task], "usr_lead")).toBe(true);
    expect(canArchiveProject(completed, [task], "usr_member")).toBe(false);
    expect(canRestoreProject(archived, "usr_lead")).toBe(true);
    expect(canRestoreProject(archived, "usr_member")).toBe(false);
  });
});
