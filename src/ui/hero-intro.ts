import { gsap } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";

export const initHeroIntro = (): void => {
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!hero) return;

  if (getMotionPreference() === "reduced") {
    gsap.set(hero.querySelectorAll(".line__inner, [data-hero-eyebrow], [data-hero-lede], [data-hero-actions] > *, [data-hero-hud], .hero__foot > *"), {
      clearProps: "all",
    });
    document.documentElement.classList.add("is-ready");
    return;
  }

  gsap.set(hero.querySelectorAll(".line__inner"), { yPercent: 118 });
  gsap.set(
    hero.querySelectorAll(
      "[data-hero-eyebrow], [data-hero-lede], [data-hero-actions] > *, [data-hero-hud], .hero__foot > *",
    ),
    { autoAlpha: 0, y: 16 },
  );

  const timeline = gsap.timeline({
    defaults: { ease: "halcyon" },
    delay: 0.18,
    onComplete: () => document.documentElement.classList.add("is-ready"),
  });

  timeline
    .to("[data-hero-eyebrow]", { autoAlpha: 1, y: 0, duration: 0.85 }, 0)
    .to(".hero .line__inner", { yPercent: 0, duration: 1.35, stagger: 0.13 }, 0.08)
    .to("[data-hero-lede]", { autoAlpha: 1, y: 0, duration: 1 }, 0.62)
    .to("[data-hero-actions] > *", { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.08 }, 0.78)
    .to("[data-hero-hud]", { autoAlpha: 1, y: 0, duration: 1 }, 0.5)
    .to(".hero__foot > *", { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06 }, 0.95);

  const onResize = (): void => {
    gsap.set(hero.querySelectorAll(".line__inner"), { yPercent: 0, clearProps: "transform" });
  };
  window.addEventListener("resize", onResize, { once: true });
};
