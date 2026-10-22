import { describe, expect, it } from "vitest";
import { calculateProgress } from "@forgeboard/domain";
import { makeTask } from "./fixtures";

describe("calculateProgress", () => {
  it("weights completion by estimate instead of task count", () => {
    const progress = calculateProgress([
      makeTask({ id: "one", estimate: 8, status: "done" }),
      makeTask({ id: "two", estimate: 5, status: "in_progress" }),
      makeTask({ id: "three", estimate: 3, status: "todo" }),
      makeTask({ id: "four", estimate: 5, status: "done" })
    ]);

    expect(progress).toMatchObject({
      percent: 62,
      completedPoints: 13,
      totalPoints: 21,
      counts: {
        total: 4,
        open: 2,
        done: 2,
        cancelled: 0
      }
    });
  });

  it("excludes cancelled tasks from effort totals but keeps them in counts", () => {
    const progress = calculateProgress([
      makeTask({ id: "one", estimate: 5, status: "done" }),
      makeTask({ id: "two", estimate: 20, status: "cancelled" })
    ]);

    expect(progress).toEqual({
      percent: 100,
      completedPoints: 5,
      totalPoints: 5,
      counts: {
        total: 2,
        open: 0,
        done: 1,
        cancelled: 1
      }
    });
  });

  it("reports zero progress when no actionable work exists", () => {
    const progress = calculateProgress([
      makeTask({ id: "one", estimate: 5, status: "cancelled" })
    ]);

    expect(progress.percent).toBe(0);
    expect(progress.totalPoints).toBe(0);
    expect(progress.counts.cancelled).toBe(1);
  });
});
