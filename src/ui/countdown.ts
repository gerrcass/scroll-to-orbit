import {
  countdownTo,
  formatCountdownLong,
  formatCountdownPadded,
  formatWindowDate,
  nextLaunchWindow,
} from "../mission/launch-window";

export const initCountdown = (): (() => void) => {
  const dates = document.querySelectorAll<HTMLElement>("[data-window-date]");
  const compact = document.querySelectorAll<HTMLElement>("[data-countdown-compact]");
  const long = document.querySelectorAll<HTMLElement>("[data-countdown-long]");
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
    if (countdown.totalSeconds === 0) target = nextLaunchWindow(now);
  };

  render();
  const interval = window.setInterval(render, 1000);

  return () => window.clearInterval(interval);
};
