import { gsap } from "./gsap";
import { getMotionPreference } from "./preferences";

export const initMarquee = (): void => {
  const track = document.querySelector<HTMLElement>("[data-marquee]");
  if (!track) return;

  const strip = track.parentElement;
  let tween: gsap.core.Tween | null = null;

  const start = (): void => {
    if (tween) return;
    gsap.set(track, { xPercent: 0 });
    tween = gsap.to(track, {
      xPercent: -50,
      duration: 34,
      ease: "none",
      repeat: -1,
    });
  };

  const stop = (): void => {
    tween?.kill();
    tween = null;
    gsap.set(track, { xPercent: 0 });
  };

  if (getMotionPreference() === "reduced") stop();
  else start();

  strip?.addEventListener("pointerenter", () => tween?.timeScale(0.24));
  strip?.addEventListener("pointerleave", () => tween?.timeScale(1));

  document.addEventListener("halcyon:motion", () => {
    if (getMotionPreference() === "reduced") stop();
    else start();
  });
};
