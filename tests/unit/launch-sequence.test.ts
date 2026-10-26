import { describe, expect, it } from "vitest";
import {
  launchSequenceForProgress,
  launchSequenceForSeconds,
} from "../../src/mission/launch-sequence";

describe("launchSequenceForSeconds", () => {
  it("moves through the five terminal states", () => {
    expect(launchSequenceForSeconds(-10)).toMatchObject({
      step: 1,
      label: "TERMINAL COUNT",
      logIndex: 0,
    });
    expect(launchSequenceForSeconds(-7)).toMatchObject({ step: 1, logIndex: 0 });
    expect(launchSequenceForSeconds(-6)).toMatchObject({ step: 2, logIndex: 1 });
    expect(launchSequenceForSeconds(-3)).toMatchObject({ step: 3, logIndex: 2 });
    expect(launchSequenceForSeconds(0)).toMatchObject({ step: 4, logIndex: 3 });
    expect(launchSequenceForSeconds(10)).toMatchObject({
      step: 5,
      label: "ASCENT",
      logIndex: 3,
    });
  });

  it("never marks a future log line as done", () => {
    expect(launchSequenceForSeconds(-10).logIndex).toBe(0);
    expect(launchSequenceForSeconds(-6).logIndex).toBe(1);
    expect(launchSequenceForSeconds(-3).logIndex).toBe(2);
    expect(launchSequenceForSeconds(0).logIndex).toBe(3);
  });

  it("has a monotonic sequence progress", () => {
    const values = [-20, -10, -6, -3, 0, 20].map(
      (seconds) => launchSequenceForSeconds(seconds).sequenceProgress,
    );
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});

describe("launchSequenceForProgress", () => {
  it("uses the mission clock rather than a naive scroll fraction", () => {
    expect(launchSequenceForProgress(0.18).label).toBe("TERMINAL COUNT");
    expect(launchSequenceForProgress(0.22).label).toBe("IGNITION SEQUENCE");
    expect(launchSequenceForProgress(0.3).label).toBe("LIFTOFF");
    expect(launchSequenceForProgress(0.4).label).toBe("ASCENT");
  });
});
