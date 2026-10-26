import { clamp } from "../lib/math";
import type { OrbitProfile, OrbitProfileId } from "./types";

export const ORBIT_PROFILES: readonly OrbitProfile[] = [
  {
    id: "LEO",
    name: "Low Earth Orbit",
    altitudeKm: 550,
    inclinationDeg: 53,
    payloadKg: 1400,
    periodMin: 95,
    angleDeg: 0,
    blurb: "A fast, flexible lane for Earth-observation constellations and technology demos.",
  },
  {
    id: "SSO",
    name: "Sun-Synchronous Orbit",
    altitudeKm: 700,
    inclinationDeg: 98.2,
    payloadKg: 1180,
    periodMin: 99,
    angleDeg: 120,
    blurb: "Dawn-to-dusk lane. The same light on every pass.",
  },
  {
    id: "GTO",
    name: "Geostationary Transfer",
    altitudeKm: 35786,
    inclinationDeg: 27,
    payloadKg: 450,
    periodMin: 720,
    angleDeg: 240,
    blurb: "The high road for communications payloads that need to hold their ground.",
  },
] as const;

export const profileById = (id: OrbitProfileId): OrbitProfile =>
  ORBIT_PROFILES.find((profile) => profile.id === id) ?? ORBIT_PROFILES[1]!;

export const profileIndex = (id: OrbitProfileId): number => {
  const index = ORBIT_PROFILES.findIndex((profile) => profile.id === id);
  return index < 0 ? 1 : index;
};

export const angleForProfile = (id: OrbitProfileId): number => profileById(id).angleDeg;

export const nearestProfile = (angleDeg: number): OrbitProfile => {
  const normalized = ((angleDeg % 360) + 360) % 360;
  let best = ORBIT_PROFILES[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const profile of ORBIT_PROFILES) {
    const distance = Math.abs(((normalized - profile.angleDeg + 540) % 360) - 180);
    if (distance < bestDistance) {
      best = profile;
      bestDistance = distance;
    }
  }
  return best;
};

export const profileFromStep = (step: number): OrbitProfile => {
  const index = clamp(Math.round(step), 0, ORBIT_PROFILES.length - 1);
  return ORBIT_PROFILES[index] ?? ORBIT_PROFILES[1]!;
};

export const orbitAngleSweep = (angleDeg: number): number => {
  const normalized = ((angleDeg % 360) + 360) % 360;
  return normalized;
};
