import { gsap } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";

export const initCursor = (): void => {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  const root = document.querySelector<HTMLElement>(".cursor");
  const dot = root?.querySelector<HTMLElement>(".cursor__dot");
  const ring = root?.querySelector<HTMLElement>(".cursor__ring");
  if (!root || !dot || !ring) return;

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.34, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.34, ease: "power3" });

  let active = false;

  const move = (event: PointerEvent): void => {
    if (getMotionPreference() === "reduced") return;
    if (!active) {
      active = true;
      gsap.to(root, { autoAlpha: 1, duration: 0.25 });
    }
    dotX(event.clientX);
    dotY(event.clientY);
    ringX(event.clientX);
    ringY(event.clientY);
  };

  const isInteractive = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    Boolean(target.closest("a, button, input, textarea, select, [data-cursor]"));

  const over = (event: PointerEvent): void => {
    if (isInteractive(event.target)) root.classList.add("is-hover");
  };
  const out = (event: PointerEvent): void => {
    if (isInteractive(event.target)) root.classList.remove("is-hover");
  };
  const leave = (): void => {
    active = false;
    gsap.to(root, { autoAlpha: 0, duration: 0.2 });
  };
  const enter = (): void => {
    if (getMotionPreference() === "reduced") return;
    active = true;
    gsap.to(root, { autoAlpha: 1, duration: 0.2 });
  };

  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", over, { passive: true });
  document.addEventListener("pointerout", out, { passive: true });
  document.addEventListener("pointerleave", leave);
  document.addEventListener("pointerenter", enter);
};
