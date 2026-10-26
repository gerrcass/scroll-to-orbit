import { describe, expect, it } from "vitest";
import {
  actForProgress,
  actMetaForProgress,
  formatAltitude,
  formatDownrange,
  formatMissionClock,
  formatStage,
  formatThrottle,
  formatVelocity,
  ignitionEnvelope,
  missionClockParts,
  missionClockSpeech,
  rocketLiftForProgress,
  telemetryForProgress,
  telemetrySentence,
} from "../../src/mission/mission";

describe("actForProgress", () => {
  it("maps the five act boundaries exactly", () => {
    expect(actForProgress(0)).toBe("PAD");
    expect(actForProgress(0.179)).toBe("PAD");
    expect(actForProgress(0.18)).toBe("IGNITION");
    expect(actForProgress(0.3)).toBe("ASCENT");
    expect(actForProgress(0.56)).toBe("SEPARATION");
    expect(actForProgress(0.72)).toBe("ORBIT");
    expect(actForProgress(1)).toBe("ORBIT");
  });

  it("clamps values outside the story", () => {
    expect(actForProgress(-3)).toBe("PAD");
    expect(actForProgress(5)).toBe("ORBIT");
  });

  it("returns matching metadata", () => {
    expect(actMetaForProgress(0.4)).toMatchObject({
      id: "ASCENT",
      index: 3,
      name: "Ascent",
      sectionId: "ascent",
    });
  });
});

describe("telemetryForProgress", () => {
  it("starts on the pad at T minus ten", () => {
    const snapshot = telemetryForProgress(0);
    expect(snapshot).toMatchObject({
      act: "PAD",
      missionTimeSeconds: -10,
      altitudeKm: 0,
      velocityKms: 0,
      throttle: 0,
      stage: 1,
      phase: "TERMINAL COUNT",
    });
  });

  it("interpolates through max-Q", () => {
    const snapshot = telemetryForProgress(0.48);
    expect(snapshot.phase).toBe("MAX-Q");
    expect(snapshot.altitudeKm).toBeCloseTo(41.8, 5);
    expect(snapshot.throttle).toBeCloseTo(72, 5);
    expect(snapshot.stage).toBe(1);
  });

  it("switches to stage two at the separation boundary", () => {
    expect(telemetryForProgress(0.679).stage).toBe(1);
    expect(telemetryForProgress(0.68).stage).toBe(2);
    expect(telemetryForProgress(0.68).phase).toBe("SECOND STAGE");
  });

  it("ends at SECO in orbit", () => {
    const snapshot = telemetryForProgress(1);
    expect(snapshot).toMatchObject({
      act: "ORBIT",
      missionTimeSeconds: 512,
      altitudeKm: 420,
      velocityKms: 7.66,
      throttle: 0,
      stage: 2,
      phase: "SECO / ORBIT",
    });
  });

  it("clamps progress beyond both ends", () => {
    expect(telemetryForProgress(-1).progress).toBe(0);
    expect(telemetryForProgress(2).progress).toBe(1);
  });
});

describe("rocketLiftForProgress", () => {
  it("holds the vehicle on the pad until ignition", () => {
    expect(rocketLiftForProgress(0)).toBe(0);
    expect(rocketLiftForProgress(0.3)).toBe(0);
  });

  it("reaches the orbit altitude offset", () => {
    expect(rocketLiftForProgress(0.72)).toBeCloseTo(44, 5);
    expect(rocketLiftForProgress(1)).toBeCloseTo(52, 5);
  });

  it("never moves backwards", () => {
    let previous = -1;
    for (let step = 0; step <= 100; step += 1) {
      const lift = rocketLiftForProgress(step / 100);
      expect(lift).toBeGreaterThanOrEqual(previous);
      previous = lift;
    }
  });
});

describe("ignitionEnvelope", () => {
  it("is silent outside ignition and ascent", () => {
    expect(ignitionEnvelope(0)).toBe(0);
    expect(ignitionEnvelope(0.8)).toBe(0);
  });

  it("rises through ignition and falls after max-Q", () => {
    expect(ignitionEnvelope(0.24)).toBe(1);
    expect(ignitionEnvelope(0.5)).toBeGreaterThan(0);
    expect(ignitionEnvelope(0.61)).toBeLessThan(0.2);
  });
});

describe("formatMissionClock", () => {
  it("formats negative time as T minus", () => {
    expect(formatMissionClock(-10)).toBe("T−00:00:10");
    expect(formatMissionClock(-512)).toBe("T−00:08:32");
  });

  it("formats positive time as T plus", () => {
    expect(formatMissionClock(0)).toBe("T+00:00:00");
    expect(formatMissionClock(134)).toBe("T+00:02:14");
    expect(formatMissionClock(3_725)).toBe("T+01:02:05");
  });

  it("exposes padded parts for the clock UI", () => {
    expect(missionClockParts(-10)).toEqual({
      prefix: "T−",
      hours: "00",
      minutes: "00",
      seconds: "10",
    });
  });
});

describe("speech and readout formatting", () => {
  it("formats a human clock", () => {
    expect(missionClockSpeech(-10)).toBe("T minus 10 seconds");
    expect(missionClockSpeech(134)).toBe("T plus 2 minutes 14 seconds");
    expect(missionClockSpeech(512)).toBe("T plus 8 minutes 32 seconds");
  });

  it("formats the readouts without false precision", () => {
    expect(formatAltitude(0)).toBe("0.0");
    expect(formatAltitude(9.5)).toBe("9.5");
    expect(formatAltitude(124.4)).toBe("124");
    expect(formatVelocity(3.421)).toBe("3.42");
    expect(formatDownrange(1128.4)).toBe("1,128");
    expect(formatThrottle(72.4)).toBe("72");
    expect(formatStage(1)).toBe("01");
    expect(formatStage(2)).toBe("02");
  });

  it("writes the telemetry as a sentence", () => {
    const sentence = telemetrySentence(telemetryForProgress(0.48));
    expect(sentence).toContain("T plus 1 minute 58 seconds");
    expect(sentence).toContain("41.8 kilometers");
    expect(sentence).toContain("96 kilometers downrange");
    expect(sentence).toContain("first stage");
    expect(sentence).toContain("max-q");
  });
});
