import { gsap } from "./gsap";
import { getMotionPreference } from "./preferences";

export const initMarquee = (): void => {
  const track = document.querySelector<HTMLElement>("[data-marquee]");
  if (!track) return;

  if (getMotionPreference() === "reduced") {
    gsap.set(track, { xPercent: 0 });
    return;
  }

  const tween = gsap.to(track, {
    xPercent: -50,
    duration: 34,
    ease: "none",
    repeat: -1,
  });

  const strip = track.parentElement;
  strip?.addEventListener("pointerenter", () => tween.timeScale(0.24));
  strip?.addEventListener("pointerleave", () => tween.timeScale(1));
};
