import "./styles/index.css";

import { initMotionPreference, subscribeMotion } from "./motion/preferences";
import { initActRail } from "./ui/act-rail";
import { initBackToTop } from "./ui/back-to-top";
import { initCountdown } from "./ui/countdown";
import { initCursor } from "./ui/cursor";
import { initHeroIntro } from "./ui/hero-intro";
import { initMenu } from "./ui/menu";
import { initMotionToggle } from "./ui/motion-toggle";
import { createStage, type Stage } from "./scene/Stage";

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
  initMotionPreference();
  initCountdown();
  initMenu();
  initCursor();
  initMotionToggle();
  initBackToTop();
  initActRail();

  const stageInstance = stage();
  if (stageInstance) {
    subscribeMotion((preference) => {
      stageInstance.setReduced(preference === "reduced");
    });
  }

  initHeroIntro();

  window.__HALCYON__ = {
    setProgress: (progress: number) => stageInstance?.setProgress(progress, true),
    getProgress: () => {
      const canvas = document.querySelector<HTMLCanvasElement>("#stage");
      return Number(canvas?.dataset.progress ?? 0);
    },
    hasWebGL: Boolean(stageInstance),
  };
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
