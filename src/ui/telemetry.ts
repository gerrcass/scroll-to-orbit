import { gsap } from "../motion/gsap";
import { clamp01 } from "../lib/math";
import { setText } from "../lib/dom";
import { getMotionPreference } from "../motion/preferences";
import { launchSequenceForSeconds } from "../mission/launch-sequence";
import {
  ACT_META,
  formatAltitude,
  formatDownrange,
  formatMissionClock,
  formatStage,
  formatThrottle,
  formatVelocity,
  missionClockParts,
  telemetrySentence,
  telemetryForProgress,
} from "../mission/mission";
import type { TelemetrySnapshot } from "../mission/types";

export interface TelemetryUI {
  update: (progress: number, snapshot: TelemetrySnapshot) => void;
}


export const initTelemetry = (): TelemetryUI => {
  const telemetryValues = new Map<string, Element[]>();
  document.querySelectorAll<HTMLElement>("[data-telemetry]").forEach((element) => {
    const key = element.dataset.telemetry;
    if (!key) return;
    const list = telemetryValues.get(key) ?? [];
    list.push(element);
    telemetryValues.set(key, list);
  });

  const clockPrefix = document.querySelector<HTMLElement>("[data-clock-prefix]");
  const clockHours = document.querySelector<HTMLElement>("[data-clock-h]");
  const clockMinutes = document.querySelector<HTMLElement>("[data-clock-m]");
  const clockSeconds = document.querySelector<HTMLElement>("[data-clock-s]");
  const launchProgress = document.querySelector<HTMLElement>("[data-launch-progress]");
  const launchStep = document.querySelector<HTMLElement>("[data-launch-step]");
  const launchStatus = document.querySelector<HTMLElement>("[data-launch-status]");
  const launchLogLines = Array.from(
    document.querySelectorAll<HTMLElement>("[data-launch-log] p"),
  );
  const screenReader = document.querySelector<HTMLElement>("[data-telemetry-sr]");

  let lastAct = "";
  let lastStatus = "";
  let lastLogIndex = -1;

  const setValues = (key: string, value: string): void => {
    telemetryValues.get(key)?.forEach((element) => setText(element, value));
  };

  const update = (progress: number, snapshot: TelemetrySnapshot): void => {
    const clock = missionClockParts(snapshot.missionTimeSeconds);
    if (clockPrefix) setText(clockPrefix, clock.prefix);
    if (clockHours) setText(clockHours, clock.hours);
    if (clockMinutes) setText(clockMinutes, clock.minutes);
    if (clockSeconds) setText(clockSeconds, clock.seconds);

    setValues("clock", formatMissionClock(snapshot.missionTimeSeconds));
    setValues("altitude", formatAltitude(snapshot.altitudeKm));
    setValues("velocity", formatVelocity(snapshot.velocityKms));
    setValues("downrange", formatDownrange(snapshot.downrangeKm));
    setValues("throttle", formatThrottle(snapshot.throttle));
    setValues("stage", formatStage(snapshot.stage));

    const launch = launchSequenceForSeconds(snapshot.missionTimeSeconds);
    if (launchProgress) {
      const ignitionStart = ACT_META.find((entry) => entry.id === "IGNITION")?.start ?? 0.18;
      const ascentStart = ACT_META.find((entry) => entry.id === "ASCENT")?.start ?? 0.3;
      const value = clamp01((progress - ignitionStart) / (ascentStart - ignitionStart));
      launchProgress.style.transform = `scaleX(${value.toFixed(4)})`;
    }
    if (launchStep) setText(launchStep, launch.label);

    if (launch.logIndex !== lastLogIndex) {
      lastLogIndex = launch.logIndex;
      launchLogLines.forEach((line, index) => {
        line.classList.toggle("is-active", index === launch.logIndex);
        line.classList.toggle("is-done", index < launch.logIndex);
      });
    }

    if (launchStatus && launch.status !== lastStatus) {
      lastStatus = launch.status;
      if (getMotionPreference() === "reduced") {
        setText(launchStatus, launch.status);
      } else {
        gsap.killTweensOf(launchStatus);
        launchStatus.textContent = "";
        gsap.to(launchStatus, {
          text: { value: launch.status },
          duration: 0.5,
          ease: "rough({strength: 1, points: 10, taper: none, randomize: true})",
          overwrite: true,
        });
      }
    }

    if (document.body.dataset.act !== snapshot.act) {
      document.body.dataset.act = snapshot.act;
      document.body.dataset.phase = snapshot.phase.toLowerCase().replaceAll(" ", "-");
    }

    if (screenReader && snapshot.act !== lastAct) {
      lastAct = snapshot.act;
      screenReader.textContent = telemetrySentence(snapshot);
    }
  };

  const initial = telemetryForProgress(0);
  update(0, initial);

  return { update };
};
