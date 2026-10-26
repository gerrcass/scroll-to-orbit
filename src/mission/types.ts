export type Act = "PAD" | "IGNITION" | "ASCENT" | "SEPARATION" | "ORBIT";

export type Stage = 1 | 2;

export type Vector3Tuple = [number, number, number];

export interface ActMeta {
  id: Act;
  index: number;
  name: string;
  sectionId: string;
  start: number;
  end: number;
}

export interface TelemetrySnapshot {
  progress: number;
  act: Act;
  actIndex: number;
  missionTimeSeconds: number;
  altitudeKm: number;
  velocityKms: number;
  downrangeKm: number;
  throttle: number;
  stage: Stage;
  phase: string;
}

export interface CameraKey {
  progress: number;
  position: Vector3Tuple;
  lookAt: Vector3Tuple;
  fov: number;
  roll: number;
}

export interface LaunchCountdown {
  target: Date;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export type OrbitProfileId = "LEO" | "SSO" | "GTO";

export interface OrbitProfile {
  id: OrbitProfileId;
  name: string;
  altitudeKm: number;
  inclinationDeg: number;
  payloadKg: number;
  periodMin: number;
  angleDeg: number;
  blurb: string;
}

export interface ManifestMission {
  id: string;
  label: string;
  orbit: OrbitProfileId;
  payloadKg: number;
  window: string;
  status: "ON PAD" | "OPEN";
}
