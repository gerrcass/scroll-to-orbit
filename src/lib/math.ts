export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export const inverseLerp = (from: number, to: number, value: number): number => {
  if (from === to) return 0;
  return clamp01((value - from) / (to - from));
};

export const smoothstep = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export const easeInCubic = (t: number): number => {
  const x = clamp01(t);
  return x * x * x;
};

export const easeOutCubic = (t: number): number => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};

export const easeInOutCubic = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const round = (value: number, precision = 0): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};
