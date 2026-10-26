import {
  countdownTo,
  formatCountdownLong,
  formatCountdownPadded,
  formatManifestDate,
  formatWindowDate,
  nextLaunchWindow,
} from "../mission/launch-window";

export const initCountdown = (): (() => void) => {
  const dates = document.querySelectorAll<HTMLElement>("[data-window-date]");
  const compact = document.querySelectorAll<HTMLElement>("[data-countdown-compact]");
  const long = document.querySelectorAll<HTMLElement>("[data-countdown-long]");
  const manifestWindows = document.querySelectorAll<HTMLElement>("[data-manifest-window]");
  const manifestOffsets = [0, 13, 27];
  let target = nextLaunchWindow(new Date());

  const render = (): void => {
    const now = new Date();
    const countdown = countdownTo(target, now);
    dates.forEach((element) => {
      element.textContent = formatWindowDate(target);
    });
    compact.forEach((element) => {
      element.textContent = formatCountdownPadded(countdown);
    });
    long.forEach((element) => {
      element.textContent = formatCountdownLong(countdown);
    });
    manifestWindows.forEach((element) => {
      const offset = Number(element.dataset.manifestWindow ?? 0);
      const index = Number.isFinite(offset) ? offset : 0;
      const days = manifestOffsets[index] ?? 0;
      element.textContent = formatManifestDate(
        new Date(target.getTime() + days * 86_400_000),
      );
    });
    if (countdown.totalSeconds === 0) target = nextLaunchWindow(now);
  };

  render();
  const interval = window.setInterval(render, 1000);

  return () => window.clearInterval(interval);
};
