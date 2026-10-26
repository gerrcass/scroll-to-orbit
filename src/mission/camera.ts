import { clamp01, inverseLerp, lerp, smoothstep } from "../lib/math";
import type { CameraKey } from "./types";

/**
 * Camera keys are absolute world-space values. The rocket's own lift is
 * derived from the same progress in mission.ts, so the shot and the vehicle
 * cannot drift apart during review.
 */
export const CAMERA_KEYS: readonly CameraKey[] = [
  {
    progress: 0,
    position: [7.2, 4.6, 15.2],
    lookAt: [-1.7, 5.0, 0],
    fov: 39,
    roll: 0,
  },
  {
    progress: 0.1,
    position: [6.6, 4.9, 14.2],
    lookAt: [-1.2, 5.2, 0],
    fov: 39,
    roll: 0,
  },
  {
    progress: 0.18,
    position: [6.0, 4.6, 15.5],
    lookAt: [-0.6, 4.6, 0],
    fov: 41,
    roll: 0,
  },
  {
    progress: 0.26,
    position: [4.8, 4.0, 16.0],
    lookAt: [0, 3.4, 0],
    fov: 46,
    roll: 0,
  },
  {
    progress: 0.34,
    position: [5.6, 15.5, 18.0],
    lookAt: [0, 13.5, 0],
    fov: 45,
    roll: 0.02,
  },
  {
    progress: 0.44,
    position: [8.0, 32.0, 23.0],
    lookAt: [0, 29.5, 0],
    fov: 47,
    roll: 0.03,
  },
  {
    progress: 0.56,
    position: [11.0, 45.0, 28.0],
    lookAt: [0, 42.5, 0],
    fov: 46,
    roll: -0.02,
  },
  {
    progress: 0.64,
    position: [12.5, 52.0, 37.0],
    lookAt: [0, 44.0, 0],
    fov: 49,
    roll: 0.05,
  },
  {
    progress: 0.72,
    position: [8.0, 53.0, 39.0],
    lookAt: [0, 46.0, 0],
    fov: 49,
    roll: 0.08,
  },
  {
    progress: 0.82,
    position: [2.0, 56.0, 62.0],
    lookAt: [0, 54.5, 0],
    fov: 50,
    roll: 0.1,
  },
  {
    progress: 0.92,
    position: [0, 62.0, 105.0],
    lookAt: [0, 52.0, -10.0],
    fov: 52,
    roll: 0.13,
  },
  {
    progress: 1,
    position: [0, 68.0, 120.0],
    lookAt: [0, 48.0, -20.0],
    fov: 52,
    roll: 0.17,
  },
] as const;

const copyInto = (from: CameraKey, to: CameraKey, progress: number): CameraKey => {
  to.progress = progress;
  to.position[0] = from.position[0];
  to.position[1] = from.position[1];
  to.position[2] = from.position[2];
  to.lookAt[0] = from.lookAt[0];
  to.lookAt[1] = from.lookAt[1];
  to.lookAt[2] = from.lookAt[2];
  to.fov = from.fov;
  to.roll = from.roll;
  return to;
};

/**
 * Writes the sampled camera into a reusable object. The render loop uses this
 * form; the allocating wrapper below is for tests and tooling.
 */
export const cameraForProgressInto = (progress: number, out: CameraKey): CameraKey => {
  const p = clamp01(progress);
  const first = CAMERA_KEYS[0]!;
  const last = CAMERA_KEYS[CAMERA_KEYS.length - 1]!;
  if (p <= first.progress) return copyInto(first, out, p);
  if (p >= last.progress) return copyInto(last, out, p);

  for (let index = 0; index < CAMERA_KEYS.length - 1; index += 1) {
    const from = CAMERA_KEYS[index]!;
    const to = CAMERA_KEYS[index + 1]!;
    if (p >= from.progress && p <= to.progress) {
      const t = smoothstep(inverseLerp(from.progress, to.progress, p));
      out.progress = p;
      out.position[0] = lerp(from.position[0], to.position[0], t);
      out.position[1] = lerp(from.position[1], to.position[1], t);
      out.position[2] = lerp(from.position[2], to.position[2], t);
      out.lookAt[0] = lerp(from.lookAt[0], to.lookAt[0], t);
      out.lookAt[1] = lerp(from.lookAt[1], to.lookAt[1], t);
      out.lookAt[2] = lerp(from.lookAt[2], to.lookAt[2], t);
      out.fov = lerp(from.fov, to.fov, t);
      out.roll = lerp(from.roll, to.roll, t);
      return out;
    }
  }

  return copyInto(first, out, p);
};

export const cameraForProgress = (progress: number): CameraKey =>
  cameraForProgressInto(progress, {
    progress: 0,
    position: [0, 0, 0],
    lookAt: [0, 0, 0],
    fov: 37,
    roll: 0,
  });
