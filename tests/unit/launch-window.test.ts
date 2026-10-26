import { describe, expect, it } from "vitest";
import {
  LAUNCH_EPOCH_MS,
  countdownTo,
  formatCountdownCompact,
  formatCountdownLong,
  formatCountdownPadded,
  formatManifestDate,
  formatWindowDate,
  nextLaunchWindow,
} from "../../src/mission/launch-window";

describe("nextLaunchWindow", () => {
  it("finds the next 14-day window after the current date", () => {
    const next = nextLaunchWindow(new Date("2026-10-25T12:00:00Z"));
    expect(next.toISOString()).toBe("2026-11-08T03:14:00.000Z");
  });

  it("rolls forward when now is exactly a window", () => {
    const next = nextLaunchWindow(new Date(LAUNCH_EPOCH_MS));
    expect(next.toISOString()).toBe("2026-01-18T03:14:00.000Z");
  });

  it("is always in the future", () => {
    for (let day = 0; day < 60; day += 1) {
      const now = new Date(Date.UTC(2026, 0, 4) + day * 86_400_000);
      expect(nextLaunchWindow(now).getTime()).toBeGreaterThan(now.getTime());
    }
  });
});

describe("countdownTo", () => {
  it("breaks the interval into days, hours, minutes, and seconds", () => {
    const target = new Date("2026-11-08T03:14:00Z");
    const countdown = countdownTo(target, new Date("2026-10-25T00:00:00Z"));
    expect(countdown.days).toBe(14);
    expect(countdown.hours).toBe(3);
    expect(countdown.minutes).toBe(14);
    expect(countdown.seconds).toBe(0);
  });

  it("never goes negative", () => {
    const countdown = countdownTo(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
    expect(countdown.totalSeconds).toBe(0);
    expect(countdown.days).toBe(0);
  });
});

describe("countdown formatting", () => {
  const countdown = countdownTo(
    new Date("2026-11-08T03:14:09Z"),
    new Date("2026-10-25T00:00:00Z"),
  );

  it("formats compact and long variants", () => {
    expect(formatCountdownCompact(countdown)).toBe("14D 03H 14M");
    expect(formatCountdownLong(countdown)).toBe("14D 03H 14M 09S");
    expect(formatCountdownPadded(countdown)).toBe("T− 14D 03H 14M");
  });

  it("formats the launch window in UTC", () => {
    expect(formatWindowDate(new Date("2026-11-08T03:14:00Z"))).toBe("08 NOV 2026 · 03:14 UTC");
  });
});


describe("formatManifestDate", () => {
  it("formats the manifest without the launch time", () => {
    expect(formatManifestDate(new Date("2026-11-08T03:14:00Z"))).toBe("08 NOV 2026");
    expect(formatManifestDate(new Date("2026-12-05T23:59:00Z"))).toBe("05 DEC 2026");
  });
});
