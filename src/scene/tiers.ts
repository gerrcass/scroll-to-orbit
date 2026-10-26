export type TierName = "low" | "mid" | "high";

export interface SceneTier {
  name: TierName;
  dpr: number;
  maxDpr: number;
  antialias: boolean;
  starCount: number;
  smokeCount: number;
  shadow: boolean;
}

const deviceMemory = (): number => {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return memory ?? 8;
};

export const detectTier = (): SceneTier => {
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = deviceMemory();
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let name: TierName = "high";
  if (width < 760 || memory <= 4 || cores <= 4 || coarse) name = "low";
  else if (width < 1280 || memory <= 8 || cores <= 8) name = "mid";

  const maxDpr = name === "high" ? 1.75 : name === "mid" ? 1.55 : 1.35;

  return {
    name,
    dpr: Math.min(window.devicePixelRatio || 1, maxDpr),
    maxDpr,
    antialias: name !== "low",
    starCount: name === "high" ? 5200 : name === "mid" ? 3200 : 1800,
    smokeCount: name === "high" ? 360 : name === "mid" ? 260 : 160,
    shadow: name !== "low",
  };
};

export const isFinePointer = (): boolean => window.matchMedia("(pointer: fine)").matches;
