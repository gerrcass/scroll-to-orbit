import { actForProgress } from "../mission/mission";

export interface ActRailUI {
  update: (progress: number) => void;
}

export const initActRail = (): ActRailUI => {
  const rail = document.querySelector<HTMLElement>("[data-act-rail]");
  const links = rail
    ? Array.from(rail.querySelectorAll<HTMLAnchorElement>("[data-act-link]"))
    : [];
  const progressBar = rail?.querySelector<HTMLElement>("[data-act-progress]") ?? null;

  let lastAct = "";
  let lastProgress = -1;

  const update = (progress: number): void => {
    const value = Math.min(1, Math.max(0, progress));
    if (progressBar && Math.abs(value - lastProgress) > 0.0005) {
      progressBar.style.transform = `scaleY(${value.toFixed(4)})`;
      lastProgress = value;
    }

    const act = actForProgress(value);
    if (act === lastAct) return;
    lastAct = act;

    links.forEach((link) => {
      const active = link.dataset.actLink === act;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  };

  update(0);
  return { update };
};
