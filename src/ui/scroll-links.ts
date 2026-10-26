import { gsap } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";

export const scrollToHash = (hash: string): void => {
  const reduced = getMotionPreference() === "reduced";
  if (hash === "#top" || hash === "#" || hash === "") {
    if (reduced) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    gsap.to(window, {
      duration: 1.15,
      ease: "halcyon",
      overwrite: "auto",
      scrollTo: { y: 0, autoKill: true },
    });
    return;
  }

  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;

  if (reduced) {
    target.scrollIntoView({ block: "start", behavior: "auto" });
    return;
  }

  gsap.to(window, {
    duration: 1.35,
    ease: "halcyon",
    overwrite: "auto",
    scrollTo: { y: target, offsetY: 0, autoKill: true },
  });
};

export const scrollToTop = (): void => {
  scrollToHash("#top");
};

export const initScrollLinks = (): void => {
  document.querySelectorAll<HTMLAnchorElement>("a[data-scroll]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("halcyon:route"));
      scrollToHash(href);
    });
  });
};
