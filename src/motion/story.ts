import { ScrollSmoother, ScrollTrigger } from "./gsap";
import { getMotionPreference } from "./preferences";
import { telemetryForProgress } from "../mission/mission";
import type { TelemetrySnapshot } from "../mission/types";

interface StorySegment {
  trigger: string;
  start?: string;
  endTrigger: string;
  end: string;
  from: number;
  to: number;
}

export interface StoryCallbacks {
  onProgress: (progress: number, snapshot: TelemetrySnapshot) => void;
  onActChange?: (snapshot: TelemetrySnapshot) => void;
}

export interface StoryHandle {
  smoother: ScrollSmoother | null;
  getProgress: () => number;
  setReduced: (reduced: boolean) => void;
  refresh: () => void;
  destroy: () => void;
}

const SEGMENTS: readonly StorySegment[] = [
  { trigger: "#top", endTrigger: "#mission", end: "top top", from: 0, to: 0.18 },
  { trigger: "#ascent", start: "top bottom", endTrigger: "#separation", end: "top top", from: 0.3, to: 0.56 },
  { trigger: "#separation", endTrigger: "#orbit", end: "top top", from: 0.56, to: 0.72 },
  { trigger: "#orbit", endTrigger: "#contact", end: "bottom bottom", from: 0.72, to: 1 },
] as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const initStory = (callbacks: StoryCallbacks): StoryHandle => {
  let reduced = getMotionPreference() === "reduced";
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  let smoother: ScrollSmoother | null = null;
  let current = 0;
  let currentAct = "";
  let pinTrigger: ScrollTrigger | null = null;
  const triggers: ScrollTrigger[] = [];

  ScrollTrigger.config({ ignoreMobileResize: true });

  const createSmoother = (): void => {
    if (smoother || !finePointer) return;
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.05,
      effects: true,
      smoothTouch: 0,
    });
  };

  if (!reduced) createSmoother();

  const emit = (progress: number): void => {
    const value = clamp01(progress);
    current = value;
    const snapshot = telemetryForProgress(value);
    callbacks.onProgress(value, snapshot);
    if (snapshot.act !== currentAct) {
      currentAct = snapshot.act;
      callbacks.onActChange?.(snapshot);
    }
  };

  if (!reduced) {
    pinTrigger = ScrollTrigger.create({
      trigger: ".launch",
      start: "top top",
      end: "+=140%",
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: (self) => emit(0.18 + (0.3 - 0.18) * self.progress),
      onLeave: () => emit(0.3),
      onLeaveBack: () => emit(0.18),
    });
  }

  let launchFallback: ScrollTrigger | null = null;
  if (reduced) {
    launchFallback = ScrollTrigger.create({
      trigger: "#mission",
      start: "top top",
      endTrigger: "#ascent",
      end: "top bottom",
      onUpdate: (self) => emit(0.18 + (0.3 - 0.18) * self.progress),
      onLeave: () => emit(0.3),
      onLeaveBack: () => emit(0.18),
    });
  }

  for (const segment of SEGMENTS) {
    const trigger = ScrollTrigger.create({
      trigger: segment.trigger,
      start: segment.start ?? "top top",
      endTrigger: segment.endTrigger,
      end: segment.end,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const value = segment.from + (segment.to - segment.from) * self.progress;
        emit(value);
      },
      onEnter: () => emit(segment.from),
      onEnterBack: () => emit(segment.to),
      onLeave: () => emit(segment.to),
      onLeaveBack: () => emit(segment.from),
    });
    triggers.push(trigger);
  }

  emit(0);

  const refresh = (): void => {
    ScrollTrigger.refresh();
  };

  const onResize = (): void => {
    window.setTimeout(refresh, 120);
  };

  window.addEventListener("resize", onResize, { passive: true });

  const onFonts = (): void => {
    void document.fonts.ready.then(() => refresh());
  };
  onFonts();

  const onMenu = (event: Event): void => {
    const detail = (event as CustomEvent<{ open?: boolean }>).detail;
    smoother?.paused(Boolean(detail?.open));
  };
  document.addEventListener("halcyon:menu", onMenu);

  const destroy = (): void => {
    window.removeEventListener("resize", onResize);
    document.removeEventListener("halcyon:menu", onMenu);
    triggers.forEach((trigger) => trigger.kill());
    pinTrigger?.kill();
    launchFallback?.kill();
    smoother?.kill();
    smoother = null;
  };

  if (import.meta.env.DEV) {
    (window as Window & { __HALCYON_SCROLL__?: () => unknown }).__HALCYON_SCROLL__ = () =>
      ScrollTrigger.getAll().map((trigger) => ({
        id: trigger.vars.id ?? trigger.trigger?.id ?? null,
        start: Math.round(trigger.start),
        end: Math.round(trigger.end),
        progress: Number(trigger.progress.toFixed(3)),
        active: trigger.isActive,
        pin: Boolean(trigger.pin),
      }));
  }

  const setReduced = (value: boolean): void => {
    if (value === reduced) return;
    reduced = value;
    const scrollY = window.scrollY;
    if (value) {
      smoother?.kill();
      smoother = null;
      window.scrollTo(0, scrollY);
    } else {
      createSmoother();
    }
    ScrollTrigger.refresh();
  };

  return {
    smoother,
    getProgress: () => current,
    setReduced,
    refresh,
    destroy,
  };
};
