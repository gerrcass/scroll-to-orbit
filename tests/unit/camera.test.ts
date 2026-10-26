import { describe, expect, it } from "vitest";
import { CAMERA_KEYS, cameraForProgress } from "../../src/mission/camera";

describe("cameraForProgress", () => {
  it("returns the first and last keys at the ends", () => {
    const first = cameraForProgress(0);
    const last = cameraForProgress(1);
    expect(first.position).toEqual(CAMERA_KEYS[0]!.position);
    expect(last.position).toEqual(CAMERA_KEYS[CAMERA_KEYS.length - 1]!.position);
    expect(first.fov).toBe(39);
    expect(last.fov).toBe(52);
  });

  it("clamps beyond the story", () => {
    expect(cameraForProgress(-1).position).toEqual(CAMERA_KEYS[0]!.position);
    expect(cameraForProgress(2).position).toEqual(CAMERA_KEYS[CAMERA_KEYS.length - 1]!.position);
  });

  it("interpolates between keys", () => {
    const middle = cameraForProgress(0.5);
    const first = CAMERA_KEYS[0]!;
    const last = CAMERA_KEYS[CAMERA_KEYS.length - 1]!;
    expect(middle.position[1]).toBeGreaterThan(first.position[1]);
    expect(middle.position[1]).toBeLessThan(last.position[1]);
    expect(middle.progress).toBe(0.5);
  });

  it("never returns a zero field of view", () => {
    for (let step = 0; step <= 100; step += 1) {
      expect(cameraForProgress(step / 100).fov).toBeGreaterThan(20);
    }
  });
});
