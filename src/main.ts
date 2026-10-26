import "./styles/index.css";

import { initMotionPreference, subscribeMotion } from "./motion/preferences";
import { initMarquee } from "./motion/marquee";
import { initReveals } from "./motion/reveals";
import { initStory } from "./motion/story";
import { createStage, type Stage } from "./scene/Stage";
import { initActRail } from "./ui/act-rail";
import { initBackToTop } from "./ui/back-to-top";
import { initCountdown } from "./ui/countdown";
import { initCursor } from "./ui/cursor";
import { initHeaderState } from "./ui/header-state";
import { initHeroIntro } from "./ui/hero-intro";
import { initMenu } from "./ui/menu";
import { initMotionToggle } from "./ui/motion-toggle";
import { initScrollLinks, scrollToHash } from "./ui/scroll-links";
import { initTelemetry } from "./ui/telemetry";

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
  initCursor();
  initMotionToggle();
  initBackToTop();

  const actRail = initActRail();
  const telemetry = initTelemetry();
  const stageInstance = stage();
  let storyProgress = 0;

  if (stageInstance) {
    subscribeMotion((preference) => {
      stageInstance.setReduced(preference === "reduced");
    });
  }

  const story = initStory({
    onProgress: (progress, snapshot) => {
      storyProgress = progress;
      stageInstance?.setProgress(progress);
      telemetry.update(progress, snapshot);
      actRail.update(progress);
    },
  });

  initScrollLinks();
  initHeaderState();
  initReveals();
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
