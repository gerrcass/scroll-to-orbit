import "./styles/index.css";

import { getMotionPreference, initMotionPreference, subscribeMotion } from "./motion/preferences";
import { initMarquee } from "./motion/marquee";
import { initReveals } from "./motion/reveals";
import { initStory } from "./motion/story";
import { reducedStillForAct } from "./mission/mission";
import type { TelemetrySnapshot } from "./mission/types";
import { createStage, type Stage } from "./scene/Stage";
import { updateAtmosphere } from "./ui/atmosphere";
import { initActRail } from "./ui/act-rail";
import { initBackToTop } from "./ui/back-to-top";
import { initContact } from "./ui/contact";
import { initCountdown } from "./ui/countdown";
import { initCursor } from "./ui/cursor";
import { initHeaderState } from "./ui/header-state";
import { initHeroIntro } from "./ui/hero-intro";
import { initMagnetic } from "./ui/magnetic";
import { initMenu } from "./ui/menu";
import { initMotionToggle } from "./ui/motion-toggle";
import { initScrollLinks, scrollToHash } from "./ui/scroll-links";
import { initTelemetry } from "./ui/telemetry";
import { initOrbit } from "./ui/orbit";
import { initVehicle } from "./ui/vehicle";

const stage = (): Stage | null => {
  const canvas = document.querySelector<HTMLCanvasElement>("#stage");
  if (!canvas) return null;

  try {
    const instance = createStage(canvas);
    document.documentElement.dataset.webgl = "true";
    instance.start();
    return instance;
  } catch (error) {
    document.documentElement.dataset.webgl = "false";
    console.info(
      "[HALCYON] WebGL is unavailable, so the designed poster is being used instead.",
      error,
    );
    return null;
  }
};

const boot = (): void => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  initMotionPreference();
  initCountdown();
  initMenu();
  initContact();
  initCursor();
  initMagnetic();
  initMotionToggle();
  initBackToTop();

  const actRail = initActRail();
  const telemetry = initTelemetry();
  const stageCanvas = document.querySelector<HTMLCanvasElement>("#stage");
  const stageInstance = stage();
  let storyProgress = 0;
  let lastSnapshot: TelemetrySnapshot | null = null;

  const story = initStory({
    onProgress: (progress, snapshot) => {
      storyProgress = progress;
      lastSnapshot = snapshot;
      const reduced = getMotionPreference() === "reduced";
      const still = reduced ? reducedStillForAct(snapshot.act) : progress;
      updateAtmosphere(still);
      if (reduced) {
        stageInstance?.setReducedStill(still);
        if (stageCanvas) stageCanvas.dataset.viewProgress = still.toFixed(3);
      } else {
        stageInstance?.setProgress(progress);
        if (stageCanvas) stageCanvas.dataset.viewProgress = progress.toFixed(3);
      }
      if (stageCanvas) stageCanvas.dataset.progress = progress.toFixed(3);
      telemetry.update(progress, snapshot);
      actRail.update(progress);
    },
  });

  subscribeMotion((preference) => {
    const reduced = preference === "reduced";
    stageInstance?.setReduced(reduced);
    if (reduced) {
      const still = reducedStillForAct(lastSnapshot?.act ?? "PAD");
      stageInstance?.setReducedStill(still);
      updateAtmosphere(still);
      if (stageCanvas) stageCanvas.dataset.viewProgress = still.toFixed(3);
    } else {
      updateAtmosphere(storyProgress);
    }
    story.setReduced(reduced);
  });

  initScrollLinks();
  initHeaderState();
  initReveals();
  initVehicle();
  initOrbit();
  initMarquee();
  initHeroIntro();
  story.refresh();

  window.__HALCYON__ = {
    setProgress: (progress: number) => stageInstance?.setProgress(progress, true),
    getProgress: () => storyProgress,
    scrollTo: (selector: string) => scrollToHash(selector),
    hasWebGL: Boolean(stageInstance),
  };
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
