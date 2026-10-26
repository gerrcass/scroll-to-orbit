import type { LaunchCountdown } from "./types";

/**
 * Vesper-01's fictional cadence. Every 14 days at 03:14 UTC, so the page never
 * advertises a window in the past. The date is arbitrary; the cadence is the
 * contract.
 */
export const LAUNCH_EPOCH_MS = Date.UTC(2026, 0, 4, 3, 14, 0);
export const LAUNCH_CADENCE_DAYS = 14;

const DAY_MS = 86_400_000;
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const nextLaunchWindow = (
  now: Date = new Date(),
  cadenceDays = LAUNCH_CADENCE_DAYS,
): Date => {
  const cadence = cadenceDays * DAY_MS;
  const elapsed = now.getTime() - LAUNCH_EPOCH_MS;
  const cycles = Math.max(0, Math.ceil(elapsed / cadence));
  let target = LAUNCH_EPOCH_MS + cycles * cadence;
  if (target <= now.getTime()) target += cadence;
  return new Date(target);
};

export const countdownTo = (target: Date, now: Date = new Date()): LaunchCountdown => {
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { target, totalSeconds, days, hours, minutes, seconds };
};

export const formatWindowDate = (date: Date): string => {
  const day = pad2(date.getUTCDate());
  const month = MONTHS[date.getUTCMonth()] ?? "JAN";
  const year = date.getUTCFullYear();
  const hours = pad2(date.getUTCHours());
  const minutes = pad2(date.getUTCMinutes());
  return `${day} ${month} ${year} · ${hours}:${minutes} UTC`;
};

export const formatCountdownCompact = (countdown: LaunchCountdown): string =>
  `${countdown.days}D ${pad2(countdown.hours)}H ${pad2(countdown.minutes)}M`;

export const formatCountdownLong = (countdown: LaunchCountdown): string =>
  `${countdown.days}D ${pad2(countdown.hours)}H ${pad2(countdown.minutes)}M ${pad2(countdown.seconds)}S`;

export const formatCountdownPadded = (countdown: LaunchCountdown): string =>
  `T− ${pad2(countdown.days)}D ${pad2(countdown.hours)}H ${pad2(countdown.minutes)}M`;
