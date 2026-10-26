import { gsap, ScrollTrigger } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";

const RECOVERY_PATH =
  "M24 126 C 70 120 120 96 168 70 C 216 44 268 32 320 34 C 370 36 392 60 382 92 C 372 122 336 138 296 134";

export const initVehicle = (): void => {
  const figure = document.querySelector<HTMLElement>(".vehicle__figure");
  const profile = document.querySelector<SVGPathElement>("[data-flight-profile]");
  const configLabel = document.querySelector<HTMLElement>("[data-config-label]");
  const profileState = document.querySelector<HTMLElement>("[data-profile-state]");
  const orbitDot = document.querySelector<SVGCircleElement>("[data-flight-orbit]");
  const landDot = document.querySelector<SVGCircleElement>("[data-flight-end]");

  if (!figure || !profile) return;

  const ascentPath = profile.getAttribute("d") ?? "";
  let reduced = getMotionPreference() === "reduced";
  let morph: gsap.core.Tween | null = null;
  let labelTrigger: ScrollTrigger | null = null;

  const showRecovery = (): void => {
    profile.setAttribute("d", RECOVERY_PATH);
    if (configLabel) configLabel.textContent = "RECOVERY CONFIGURATION";
    if (profileState) profileState.textContent = "RECOVERY / RETURN";
    if (landDot) landDot.style.opacity = "1";
    if (orbitDot) orbitDot.style.opacity = "0.2";
  };

  const stopMorph = (): void => {
    morph?.kill();
    labelTrigger?.kill();
    morph = null;
    labelTrigger = null;
    showRecovery();
  };

  const startMorph = (): void => {
    if (reduced || morph) return;
    profile.setAttribute("d", ascentPath);
    if (configLabel) configLabel.textContent = "ASCENT CONFIGURATION";
    if (profileState) profileState.textContent = "ASCENT → RECOVERY";

    morph = gsap.to(profile, {
      morphSVG: "#flight-recovery",
      ease: "none",
      scrollTrigger: {
        trigger: ".vehicle",
        start: "top 60%",
        end: "bottom 45%",
        scrub: 1,
      },
    });
    morph.progress(0);

    if (orbitDot) gsap.set(orbitDot, { opacity: 1 });
    if (landDot) gsap.set(landDot, { opacity: 0.16 });

    let lastRecovery: boolean | null = null;
    labelTrigger = ScrollTrigger.create({
      trigger: ".vehicle",
      start: "top 60%",
      end: "bottom 45%",
      onUpdate: (self) => {
        const recovery = self.progress > 0.48;
        if (recovery === lastRecovery) return;
        lastRecovery = recovery;
        if (configLabel) {
          configLabel.textContent = recovery ? "RECOVERY CONFIGURATION" : "ASCENT CONFIGURATION";
        }
        if (profileState) {
          profileState.textContent = recovery ? "RECOVERY / RETURN" : "ASCENT → RECOVERY";
        }
        if (landDot) gsap.to(landDot, { opacity: recovery ? 1 : 0.16, duration: 0.25 });
        if (orbitDot) gsap.to(orbitDot, { opacity: recovery ? 0.2 : 1, duration: 0.25 });
      },
    });
  };

  document.addEventListener("halcyon:motion", () => {
    reduced = getMotionPreference() === "reduced";
    if (reduced) stopMorph();
    else startMorph();
  });

  if (reduced) {
    showRecovery();
    gsap.set(".schematic__draw path", { drawSVG: "100%" });
    return;
  }

  ScrollTrigger.create({
    trigger: figure,
    start: "top 78%",
    once: true,
    onEnter: () => {
      gsap.fromTo(
        ".schematic__draw path",
        { drawSVG: "0%" },
        {
          drawSVG: "100%",
          duration: 1.35,
          stagger: 0.08,
          ease: "power2.inOut",
        },
      );
      gsap.fromTo(
        ".schematic__dim path",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, delay: 0.55, ease: "power1.out" },
      );
      gsap.fromTo(
        ".schematic__labels text",
        { autoAlpha: 0, x: 8 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.55,
          stagger: 0.045,
          delay: 0.4,
          ease: "halcyon",
        },
      );
    },
  });

  startMorph();
};
