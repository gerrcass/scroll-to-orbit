import { gsap } from "../motion/gsap";
import { actForProgress } from "../mission/mission";

export const initActRail = (): void => {
  const rail = document.querySelector<HTMLElement>("[data-act-rail]");
  if (!rail) return;
  const links = Array.from(rail.querySelectorAll<HTMLAnchorElement>("[data-act-link]"));
  const progress = rail.querySelector<HTMLElement>("[data-act-progress]");

  const set = (value: number): void => {
    const act = actForProgress(value);
    links.forEach((link) => {
      const active = link.dataset.actLink === act;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    if (progress) gsap.set(progress, { scaleY: value });
  };

  set(0);
};
