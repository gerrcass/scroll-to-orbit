import { clamp01, lerp } from "../lib/math";

let lastProgress = -1;

export const updateAtmosphere = (progress: number): void => {
  const value = clamp01(progress);
  if (Math.abs(value - lastProgress) < 0.002) return;
  lastProgress = value;

  const ember = lerp(0.16, 0.015, clamp01(value * 1.5));
  const cold = lerp(0.2, 0.95, clamp01((value - 0.2) * 1.3));
  const root = document.documentElement;
  root.style.setProperty("--sky-ember", ember.toFixed(3));
  root.style.setProperty("--sky-cold", cold.toFixed(3));
};
