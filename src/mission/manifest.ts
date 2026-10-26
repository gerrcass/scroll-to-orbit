import type { ManifestMission } from "./types";

export const MANIFEST: readonly ManifestMission[] = [
  {
    id: "VESPER-01",
    label: "NIGHT FLIGHT",
    orbit: "SSO",
    payloadKg: 1180,
    window: "08 NOV 2026",
    status: "ON PAD",
  },
  {
    id: "NORTHWIND-03",
    label: "RIDESHARE",
    orbit: "LEO",
    payloadKg: 2400,
    window: "21 NOV 2026",
    status: "OPEN",
  },
  {
    id: "TIDAL-07",
    label: "DEDICATED",
    orbit: "GTO",
    payloadKg: 450,
    window: "05 DEC 2026",
    status: "OPEN",
  },
] as const;

export const manifestById = (id: string): ManifestMission | undefined =>
  MANIFEST.find((mission) => mission.id === id);
