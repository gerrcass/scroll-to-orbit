import { clamp01, easeInCubic, easeOutCubic, inverseLerp, lerp, round } from "../lib/math";
import type { Act, ActMeta, Stage, TelemetrySnapshot } from "./types";

export const ACT_META: readonly ActMeta[] = [
  { id: "PAD", index: 1, name: "Pad", sectionId: "top", start: 0, end: 0.18 },
  { id: "IGNITION", index: 2, name: "Ignition", sectionId: "mission", start: 0.18, end: 0.3 },
  { id: "ASCENT", index: 3, name: "Ascent", sectionId: "ascent", start: 0.3, end: 0.56 },
  {
    id: "SEPARATION",
    index: 4,
    name: "Separation",
    sectionId: "separation",
    start: 0.56,
    end: 0.72,
  },
  { id: "ORBIT", index: 5, name: "Orbit", sectionId: "orbit", start: 0.72, end: 1 },
] as const;

interface MissionKey {
  progress: number;
  time: number;
  altitude: number;
  velocity: number;
  downrange: number;
  throttle: number;
}

const MISSION_KEYS: readonly MissionKey[] = [
  { progress: 0, time: -10, altitude: 0, velocity: 0, downrange: 0, throttle: 0 },
  { progress: 0.18, time: -10, altitude: 0, velocity: 0, downrange: 0, throttle: 0 },
  { progress: 0.22, time: -6, altitude: 0, velocity: 0, downrange: 0, throttle: 100 },
  { progress: 0.3, time: 0, altitude: 0.02, velocity: 0.04, downrange: 0.1, throttle: 100 },
  { progress: 0.4, time: 65, altitude: 18.4, velocity: 0.76, downrange: 31.6, throttle: 96 },
  { progress: 0.48, time: 118, altitude: 41.8, velocity: 1.35, downrange: 96.4, throttle: 72 },
  { progress: 0.56, time: 170, altitude: 86.2, velocity: 2.21, downrange: 226.8, throttle: 100 },
  { progress: 0.63, time: 205, altitude: 124.5, velocity: 2.98, downrange: 362.1, throttle: 100 },
  { progress: 0.68, time: 232, altitude: 149.8, velocity: 3.42, downrange: 452.7, throttle: 100 },
  { progress: 0.72, time: 260, altitude: 176.4, velocity: 3.91, downrange: 548.3, throttle: 100 },
  { progress: 0.82, time: 340, altitude: 262.7, velocity: 5.24, downrange: 821.6, throttle: 100 },
  { progress: 0.92, time: 430, altitude: 352.3, velocity: 6.61, downrange: 1128.4, throttle: 100 },
  { progress: 1, time: 512, altitude: 420, velocity: 7.66, downrange: 1400, throttle: 0 },
] as const;

const STAGE_SEPARATION_PROGRESS = 0.68;

export const actForProgress = (progress: number): Act => {
  const p = clamp01(progress);
  for (let index = ACT_META.length - 1; index >= 0; index -= 1) {
    const act = ACT_META[index];
    if (act && p >= act.start) return act.id;
  }
  return "PAD";
};

export const actMetaForProgress = (progress: number): ActMeta => {
  const act = actForProgress(progress);
  return ACT_META.find((entry) => entry.id === act) ?? ACT_META[0]!;
};

const phaseForProgress = (progress: number): string => {
  if (progress < 0.18) return "TERMINAL COUNT";
  if (progress < 0.23) return "IGNITION";
  if (progress < 0.3) return "LIFTOFF";
  if (progress < 0.46) return "ASCENT";
  if (progress < 0.52) return "MAX-Q";
  if (progress < 0.6) return "MAX-Q RECOVERY";
  if (progress < STAGE_SEPARATION_PROGRESS) return "STAGE SEPARATION";
  if (progress < 0.76) return "SECOND STAGE";
  if (progress < 0.86) return "FAIRING SEPARATION";
  if (progress < 0.97) return "ORBIT INSERTION";
  return "SECO / ORBIT";
};

const interpolateKey = (progress: number): MissionKey => {
  const p = clamp01(progress);
  const last = MISSION_KEYS[MISSION_KEYS.length - 1]!;
  if (p >= last.progress) return last;

  for (let index = 0; index < MISSION_KEYS.length - 1; index += 1) {
    const from = MISSION_KEYS[index]!;
    const to = MISSION_KEYS[index + 1]!;
    if (p >= from.progress && p <= to.progress) {
      const t = inverseLerp(from.progress, to.progress, p);
      return {
        progress: p,
        time: lerp(from.time, to.time, t),
        altitude: lerp(from.altitude, to.altitude, t),
        velocity: lerp(from.velocity, to.velocity, t),
        downrange: lerp(from.downrange, to.downrange, t),
        throttle: lerp(from.throttle, to.throttle, t),
      };
    }
  }

  return MISSION_KEYS[0]!;
};

export const telemetryForProgress = (progress: number): TelemetrySnapshot => {
  const p = clamp01(progress);
  const key = interpolateKey(p);
  const act = actMetaForProgress(p);

  return {
    progress: p,
    act: act.id,
    actIndex: act.index,
    missionTimeSeconds: key.time,
    altitudeKm: key.altitude,
    velocityKms: key.velocity,
    downrangeKm: key.downrange,
    throttle: key.throttle,
    stage: (p >= STAGE_SEPARATION_PROGRESS ? 2 : 1) as Stage,
    phase: phaseForProgress(p),
  };
};

/**
 * The rocket begins moving only after ignition. The camera keys are absolute
 * world-space positions; this lift is the shared source of truth that keeps the
 * vehicle and the camera in the same frame.
 */
export const rocketLiftForProgress = (progress: number): number => {
  const p = clamp01(progress);
  if (p <= 0.3) return 0;
  if (p <= 0.72) return lerp(0, 44, easeInCubic(inverseLerp(0.3, 0.72, p)));
  return lerp(44, 52, easeOutCubic(inverseLerp(0.72, 1, p)));
};

export const throttleForProgress = (progress: number): number =>
  telemetryForProgress(progress).throttle / 100;

export const ignitionEnvelope = (progress: number): number => {
  const p = clamp01(progress);
  if (p < 0.18 || p > 0.62) return 0;
  const rise = inverseLerp(0.18, 0.24, p);
  const fall = 1 - inverseLerp(0.48, 0.62, p);
  return Math.min(rise, fall);
};

export const formatMissionClock = (seconds: number): string => {
  const total = Math.abs(Math.round(seconds));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const secs = total % 60;
  return `${seconds < 0 ? "T−" : "T+"}${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`;
};

export const missionClockParts = (
  seconds: number,
): { prefix: string; hours: string; minutes: string; seconds: string } => {
  const total = Math.abs(Math.round(seconds));
  return {
    prefix: seconds < 0 ? "T−" : "T+",
    hours: pad2(Math.floor(total / 3_600)),
    minutes: pad2(Math.floor((total % 3_600) / 60)),
    seconds: pad2(total % 60),
  };
};

export const missionClockSpeech = (seconds: number): string => {
  const total = Math.abs(Math.round(seconds));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const secs = total % 60;
  const units = [
    hours > 0 ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "",
    minutes > 0 ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}` : "",
    secs > 0 || (hours === 0 && minutes === 0) ? `${secs} ${secs === 1 ? "second" : "seconds"}` : "",
  ].filter(Boolean);

  return `${seconds < 0 ? "T minus" : "T plus"} ${units.join(" ")}`.trim();
};

export const formatAltitude = (value: number): string =>
  value < 10 ? value.toFixed(1) : String(Math.round(value));

export const formatVelocity = (value: number): string => value.toFixed(2);

export const formatDownrange = (value: number): string => Math.round(value).toLocaleString("en-US");

export const formatThrottle = (value: number): string => String(Math.round(value));

export const formatStage = (stage: Stage): string => String(stage).padStart(2, "0");

export const telemetrySentence = (snapshot: TelemetrySnapshot): string => {
  const clock = missionClockSpeech(snapshot.missionTimeSeconds);
  const stage = snapshot.stage === 1 ? "first stage" : "second stage";
  return `${clock}. Kestrel is ${round(snapshot.altitudeKm, 1)} kilometers above the Atlantic, ${Math.round(snapshot.downrangeKm)} kilometers downrange, travelling at ${snapshot.velocityKms.toFixed(2)} kilometers per second. ${stage}, throttle ${Math.round(snapshot.throttle)} percent. Phase: ${snapshot.phase.toLowerCase()}.`;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
