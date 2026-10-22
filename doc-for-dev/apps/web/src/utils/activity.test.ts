import { describe, expect, it } from "vitest";
import type { ActivityDto } from "@forgeboard/shared";
import { describeActivity } from "./activity";

const actor = {
  id: "usr_test",
  name: "Test User",
  title: "Engineer"
};

describe("describeActivity", () => {
  it("describes project status changes with labels", () => {
    const activity: ActivityDto = {
      id: "act_1",
      kind: "project.status_changed",
      actor,
      createdAt: "2026-01-01T00:00:00.000Z",
      from: "active",
      to: "paused"
    };

    expect(describeActivity(activity)).toBe(
      "moved the project from Active to Paused"
    );
  });

  it("quotes task titles in task events", () => {
    const activity: ActivityDto = {
      id: "act_2",
      kind: "task.status_changed",
      actor,
      createdAt: "2026-01-01T00:00:00.000Z",
      task: { id: "tsk_1", title: "Fix retries" },
      from: "in_progress",
      to: "done"
    };

    expect(describeActivity(activity)).toBe(
      "moved “Fix retries” from In progress to Done"
    );
  });
});
