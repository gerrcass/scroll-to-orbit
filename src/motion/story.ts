import { ScrollSmoother, ScrollTrigger } from "./gsap";
import { getMotionPreference } from "./preferences";
import { clamp01 } from "../lib/math";
import { ACT_META, telemetryForProgress } from "../mission/mission";
import type { Act, TelemetrySnapshot } from "../mission/types";

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
  getProgress: () => number;
  setReduced: (reduced: boolean) => void;
  refresh: () => void;
  destroy: () => void;
}

const actStart = (act: Act): number => ACT_META.find((entry) => entry.id === act)?.start ?? 0;
const IGNITION_START = actStart("IGNITION");
const ASCENT_START = actStart("ASCENT");
const SEPARATION_START = actStart("SEPARATION");
const ORBIT_START = actStart("ORBIT");

const SEGMENTS: readonly StorySegment[] = [
  { trigger: "#top", endTrigger: "#mission", end: "top top", from: 0, to: IGNITION_START },
  {
    trigger: "#ascent",
    start: "top bottom",
    endTrigger: "#separation",
    end: "top top",
    from: ASCENT_START,
    to: SEPARATION_START,
  },
  {
    trigger: "#separation",
    endTrigger: "#orbit",
    end: "top top",
    from: SEPARATION_START,
    to: ORBIT_START,
  },
  {
    trigger: "#orbit",
    endTrigger: "#contact",
    end: "bottom bottom",
    from: ORBIT_START,
    to: 1,
  },
] as const;

export const initStory = (callbacks: StoryCallbacks): StoryHandle => {
  let reduced = getMotionPreference() === "reduced";
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  let smoother: ScrollSmoother | null = null;
  let current = 0;
  let currentAct = "";
  let launchTrigger: ScrollTrigger | null = null;
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

  const launchValue = (segmentProgress: number): number =>
    IGNITION_START + (ASCENT_START - IGNITION_START) * segmentProgress;

  /**
   * The launch section is pinned only in full motion. Reduced motion uses a
   * normal scroll trigger so the same countdown still advances without a pin.
   * The trigger is rebuilt on a live motion toggle so both directions agree.
   */
  const createLaunchTrigger = (): void => {
    launchTrigger?.kill();
    if (reduced) {
      launchTrigger = ScrollTrigger.create({
        trigger: "#mission",
        start: "top top",
        endTrigger: "#ascent",
        end: "top bottom",
        onUpdate: (self) => emit(launchValue(self.progress)),
        onLeave: () => emit(ASCENT_START),
        onLeaveBack: () => emit(IGNITION_START),
      });
      return;
    }

    launchTrigger = ScrollTrigger.create({
      trigger: ".launch",
      start: "top top",
      end: "+=140%",
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: (self) => emit(launchValue(self.progress)),
      onLeave: () => emit(ASCENT_START),
      onLeaveBack: () => emit(IGNITION_START),
    });
  };

  createLaunchTrigger();

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

  void document.fonts.ready.then(() => refresh());

  const onMenu = (event: Event): void => {
    const detail = (event as CustomEvent<{ open?: boolean }>).detail;
    smoother?.paused(Boolean(detail?.open));
  };
  document.addEventListener("halcyon:menu", onMenu);

  const destroy = (): void => {
    window.removeEventListener("resize", onResize);
    document.removeEventListener("halcyon:menu", onMenu);
    triggers.forEach((trigger) => trigger.kill());
    launchTrigger?.kill();
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
    } else {
      createSmoother();
    }

    createLaunchTrigger();
    ScrollTrigger.refresh();
    window.scrollTo(0, scrollY);
  };

  return {
    getProgress: () => current,
    setReduced,
    refresh,
    destroy,
  };
};
