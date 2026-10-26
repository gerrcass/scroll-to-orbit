import { gsap, SplitText, ScrollTrigger } from "./gsap";
import { getMotionPreference } from "./preferences";

export const initReveals = (): void => {
  if (getMotionPreference() === "reduced") return;

  const headings = document.querySelectorAll<HTMLElement>('[data-split="section"]');
  headings.forEach((heading) => {
    SplitText.create(heading, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 112,
          opacity: 0,
          duration: 1.15,
          stagger: 0.075,
          ease: "halcyon",
          scrollTrigger: {
            trigger: heading,
            start: "top 86%",
            once: true,
          },
        }),
    });
  });

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
    gsap.from(element, {
      y: 22,
      autoAlpha: 0,
      duration: 0.95,
      ease: "halcyon",
      scrollTrigger: {
        trigger: element,
        start: "top 91%",
        once: true,
      },
    });
  });

  ScrollTrigger.refresh();
};
