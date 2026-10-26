import { telemetryForProgress } from "./mission";

export interface LaunchSequenceState {
  step: 1 | 2 | 3 | 4 | 5;
  label: string;
  status: string;
  logIndex: 0 | 1 | 2 | 3;
  sequenceProgress: number;
}

/**
 * The terminal count has five visible states. Keeping this out of the DOM
 * module means the status line, the log highlight, and the tests cannot drift.
 */
export const launchSequenceForSeconds = (seconds: number): LaunchSequenceState => {
  if (seconds < -6) {
    return {
      step: 1,
      label: "TERMINAL COUNT",
      status: "TERMINAL COUNT / ALL SYSTEMS NOMINAL",
      logIndex: 0,
      sequenceProgress: 0,
    };
  }
  if (seconds < -3) {
    return {
      step: 2,
      label: "IGNITION SEQUENCE",
      status: "IGNITION SEQUENCE / THROAT PRESSURE NOMINAL",
      logIndex: 1,
      sequenceProgress: 0.25,
    };
  }
  if (seconds < 0) {
    return {
      step: 3,
      label: "GO FOR LAUNCH",
      status: "PROPELLANT LOADED / GO FOR LAUNCH",
      logIndex: 2,
      sequenceProgress: 0.5,
    };
  }
  if (seconds < 10) {
    return {
      step: 4,
      label: "LIFTOFF",
      status: "LIFTOFF / ENGINES NOMINAL",
      logIndex: 3,
      sequenceProgress: 0.75,
    };
  }
  return {
    step: 5,
    label: "ASCENT",
    status: "ASCENT / PITCH PROGRAM",
    logIndex: 3,
    sequenceProgress: 1,
  };
};

export const launchSequenceForProgress = (progress: number): LaunchSequenceState =>
  launchSequenceForSeconds(telemetryForProgress(progress).missionTimeSeconds);
