import { clamp01, inverseLerp, lerp, smoothstep } from "../lib/math";
import type { CameraKey, Vector3Tuple } from "./types";

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
    position: [5.6, 5.0, 12.4],
    lookAt: [-0.8, 5.5, 0],
    fov: 39,
    roll: 0,
  },
  {
    progress: 0.26,
    position: [4.8, 5.6, 12.4],
    lookAt: [-0.2, 6.2, 0],
    fov: 40,
    roll: 0,
  },
  {
    progress: 0.34,
    position: [5.6, 7.5, 14.5],
    lookAt: [0, 7.2, 0],
    fov: 42,
    roll: 0.01,
  },
  {
    progress: 0.44,
    position: [8, 11, 18],
    lookAt: [0, 10, 0],
    fov: 45,
    roll: 0.02,
  },
  {
    progress: 0.56,
    position: [11, 17, 23],
    lookAt: [0, 15.5, 0],
    fov: 46,
    roll: -0.03,
  },
  {
    progress: 0.64,
    position: [12.5, 22, 26],
    lookAt: [0, 21, 0],
    fov: 46,
    roll: 0.04,
  },
  {
    progress: 0.72,
    position: [8, 42, 34],
    lookAt: [0, 40, 0],
    fov: 47,
    roll: 0.06,
  },
  {
    progress: 0.82,
    position: [2, 50, 62],
    lookAt: [0, 44, 0],
    fov: 50,
    roll: 0.09,
  },
  {
    progress: 0.92,
    position: [0, 55, 105],
    lookAt: [0, 30, -10],
    fov: 52,
    roll: 0.12,
  },
  {
    progress: 1,
    position: [0, 60, 120],
    lookAt: [0, 20, -20],
    fov: 52,
    roll: 0.16,
  },
] as const;

const mix = (from: Vector3Tuple, to: Vector3Tuple, t: number): Vector3Tuple => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
  lerp(from[2], to[2], t),
];

export const cameraForProgress = (progress: number): CameraKey => {
  const p = clamp01(progress);
  const first = CAMERA_KEYS[0]!;
  const last = CAMERA_KEYS[CAMERA_KEYS.length - 1]!;
  if (p <= first.progress) return cloneKey(first);
  if (p >= last.progress) return cloneKey(last);

  for (let index = 0; index < CAMERA_KEYS.length - 1; index += 1) {
    const from = CAMERA_KEYS[index]!;
    const to = CAMERA_KEYS[index + 1]!;
    if (p >= from.progress && p <= to.progress) {
      const t = smoothstep(inverseLerp(from.progress, to.progress, p));
      return {
        progress: p,
        position: mix(from.position, to.position, t),
        lookAt: mix(from.lookAt, to.lookAt, t),
        fov: lerp(from.fov, to.fov, t),
        roll: lerp(from.roll, to.roll, t),
      };
    }
  }

  return cloneKey(first);
};

const cloneKey = (key: CameraKey): CameraKey => ({
  ...key,
  position: [...key.position],
  lookAt: [...key.lookAt],
});
