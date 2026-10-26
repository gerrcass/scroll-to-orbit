import { gsap } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";

export const initMagnetic = (): void => {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((element) => {
    const xTo = gsap.quickTo(element, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.35, ease: "power3.out" });

    element.addEventListener("pointermove", (event) => {
      if (getMotionPreference() === "reduced") return;
      const bounds = element.getBoundingClientRect();
      xTo((event.clientX - (bounds.left + bounds.width / 2)) * 0.16);
      yTo((event.clientY - (bounds.top + bounds.height / 2)) * 0.16);
    });

    element.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
};
