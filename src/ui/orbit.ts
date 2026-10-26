import { Draggable, gsap, ScrollTrigger } from "../motion/gsap";
import { setText } from "../lib/dom";
import { getMotionPreference } from "../motion/preferences";
import {
  ORBIT_PROFILES,
  profileIndex,
  profileById,
  nearestProfile,
} from "../mission/orbit-profiles";
import type { OrbitProfile } from "../mission/types";

const NEEDLE_OFFSET = 90;

const needleRotation = (profile: OrbitProfile): number => profile.angleDeg - NEEDLE_OFFSET;

const profileForRotation = (rotation: number): OrbitProfile =>
  nearestProfile(rotation + NEEDLE_OFFSET);

export const initOrbit = (): void => {
  const knob = document.querySelector<HTMLElement>("[data-dial-knob]");
  const drag = document.querySelector<HTMLElement>("[data-dial-drag]");
  const needle = document.querySelector<HTMLElement>("[data-dial-pointer]");
  const nameEl = document.querySelector<HTMLElement>('[data-dial="name"]');
  const altitudeEl = document.querySelector<HTMLElement>('[data-dial="altitude"]');
  const inclinationEl = document.querySelector<HTMLElement>('[data-dial="inclination"]');
  const payloadEl = document.querySelector<HTMLElement>('[data-dial="payload"]');
  const periodEl = document.querySelector<HTMLElement>('[data-dial="period"]');
  const blurbEl = document.querySelector<HTMLElement>('[data-dial="blurb"]');
  const satellite = document.querySelector<SVGCircleElement>("[data-orbit-sat]");
  const mapPaths = Array.from(document.querySelectorAll<SVGElement>("[data-orbit-path]"));
  const mapLabels = Array.from(document.querySelectorAll<SVGElement>("[data-orbit-label]"));
  const notches = Array.from(document.querySelectorAll<HTMLElement>("[data-dial-notch]"));
  const orbitMap = document.querySelector<HTMLElement>(".orbit-map");
  const dialHint = document.querySelector<HTMLElement>("[data-dial-hint]");
  let reduced = getMotionPreference() === "reduced";

  let current = profileById("SSO");

  const renderHint = (): void => {
    if (dialHint) {
      dialHint.textContent = getMotionPreference() === "reduced" ? "ARROW KEYS" : "DRAG / ARROW KEYS";
    }
  };
  let draggable: Draggable | null = null;
  let satelliteTween: gsap.core.Tween | null = null;


  const originalPaths = mapPaths.map((path) => ({
    element: path,
    stroke: path.getAttribute("stroke"),
    width: path.getAttribute("stroke-width"),
  }));

  const highlightPath = (profile: OrbitProfile): void => {
    originalPaths.forEach(({ element, stroke, width }) => {
      if (element.dataset.orbitPath === profile.id) {
        element.setAttribute("stroke", "#ff5a1f");
        element.setAttribute("stroke-width", "1.8");
        element.style.filter = "drop-shadow(0 0 6px rgba(255,90,31,.55))";
      } else {
        if (stroke) element.setAttribute("stroke", stroke);
        if (width) element.setAttribute("stroke-width", width);
        element.style.filter = "";
      }
    });
    mapLabels.forEach((label) => {
      label.classList.toggle("is-active", label.dataset.orbitLabel === profile.id);
    });
    notches.forEach((notch) => {
      notch.classList.toggle("is-active", notch.dataset.dialNotch === profile.id);
    });
  };

  const readout = (profile: OrbitProfile): void => {
    setText(nameEl, profile.id);
    setText(altitudeEl, profile.altitudeKm.toLocaleString("en-US"));
    setText(inclinationEl, profile.inclinationDeg.toFixed(1));
    setText(payloadEl, profile.payloadKg.toLocaleString("en-US"));
    setText(periodEl, String(profile.periodMin));
    setText(blurbEl, profile.blurb);
    if (knob) {
      knob.setAttribute("aria-valuenow", String(profileIndex(profile.id)));
      knob.setAttribute("aria-valuetext", `${profile.name}, ${profile.altitudeKm} kilometers`);
    }
  };

  const moveSatellite = (profile: OrbitProfile, immediate = false): void => {
    if (!satellite) return;
    const path = document.querySelector<SVGPathElement>(`[data-orbit-path="${profile.id}"]`);
    if (!path) return;

    satelliteTween?.kill();
    gsap.set(satellite, { x: 0, y: 0, rotation: 0 });

    if (reduced) {
      gsap.to(satellite, {
        duration: 0.01,
        motionPath: {
          path,
          start: 0.62,
          end: 0.62,
        },
      });
      return;
    }

    satelliteTween = gsap.to(satellite, {
      duration: 10,
      repeat: -1,
      ease: "none",
      delay: immediate ? 0 : 0.8,
      motionPath: {
        path,
        start: 0,
        end: 1,
      },
    });
  };

  const applyProfile = (profile: OrbitProfile, animate = true): void => {
    current = profile;
    const rotation = needleRotation(profile);
    if (needle) {
      gsap.to(needle, {
        rotation,
        duration: animate ? 0.55 : 0,
        ease: "halcyon",
        overwrite: true,
      });
    }
    if (drag) {
      gsap.set(drag, { rotation });
      draggable?.update();
    }
    readout(profile);
    highlightPath(profile);
    moveSatellite(profile, animate);
  };

  const snapRotation = (value: number): number => needleRotation(profileForRotation(value));

  const updateFromRotation = (rotation: number): void => {
    const profile = profileForRotation(rotation);
    if (needle) gsap.set(needle, { rotation });
    readout(profile);
    highlightPath(profile);
  };

  if (profileIndex("SSO") !== -1) {
    applyProfile(current, false);
  }

  if (knob && drag) {
    gsap.set(drag, { rotation: needleRotation(current) });

    [draggable] = Draggable.create(drag, {
      type: "rotation",
      trigger: knob,
      inertia: true,
      bounds: { minRotation: -105, maxRotation: 165 },
      snap: (value: number) => snapRotation(value),
      onPress: () => knob.focus(),
      onDrag: function (this: Draggable) {
        updateFromRotation(this.rotation);
      },
      onThrowUpdate: function (this: Draggable) {
        updateFromRotation(this.rotation);
      },
      onThrowComplete: function (this: Draggable) {
        applyProfile(profileForRotation(this.rotation), true);
      },
    });
    if (reduced) draggable?.disable();

    knob.addEventListener("keydown", (event) => {
      const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const index = ORBIT_PROFILES.indexOf(current);
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = Math.min(2, index + 1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = Math.max(0, index - 1);
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = 2;
      const profile = ORBIT_PROFILES[next];
      if (profile) applyProfile(profile, true);
    });
  }

  if (orbitMap) {
    if (reduced) {
      gsap.set(mapPaths, { drawSVG: "100%" });
    } else {
      gsap.from(mapPaths, {
        drawSVG: "0%",
        duration: 1.15,
        stagger: 0.08,
        ease: "slow(0.7, 0.7)",
        scrollTrigger: {
          trigger: orbitMap,
          start: "top 82%",
          once: true,
        },
      });
    }
  }

  renderHint();

  document.addEventListener("halcyon:motion", () => {
    reduced = getMotionPreference() === "reduced";
    renderHint();
    if (reduced) {
      satelliteTween?.kill();
      draggable?.disable();
      moveSatellite(current, true);
    } else {
      draggable?.enable();
      moveSatellite(current, true);
    }
  });

  ScrollTrigger.refresh();
};
