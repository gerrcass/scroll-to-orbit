import * as THREE from "three";
import { gsap } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";
import {
  SCENE_EVENTS,
  ignitionEnvelope,
  rocketLiftForProgress,
  throttleForProgress,
} from "../mission/mission";
import { clamp01, inverseLerp } from "../lib/math";
import { CameraRig } from "./camera-rig";
import { createPad, type PadModel } from "./pad";
import { createRocket, type KestrelModel } from "./rocket";
import { createSmoke, type SmokeSystem } from "./smoke";
import { createSmokeCloud, type SmokeCloud } from "./smoke-cloud";
import { createGlowTexture } from "./textures";
import { createEarth, type EarthModel } from "./earth";
import { createStarField, type StarField } from "./stars";
import { detectTier, type SceneTier } from "./tiers";

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly tier: SceneTier;

  private readonly rig: CameraRig;
  private readonly rocket: KestrelModel;
  private readonly pad: PadModel;
  private readonly stars: StarField;
  private readonly smoke: SmokeSystem;
  private readonly smokeCloud: SmokeCloud;
  private readonly earth: EarthModel;
  private readonly ignitionGlow: THREE.Sprite;
  private readonly ignitionGlowTexture: THREE.CanvasTexture;
  private readonly padFlash: THREE.PointLight;
  private moon: THREE.Mesh | null = null;
  private lastTimestamp = 0;

  private progress = 0;
  private targetProgress = 0;
  private time = 0;
  private paused = false;
  private running = false;
  private reduced = false;
  private pointerX = 0;
  private pointerY = 0;
  private pointerTargetX = 0;
  private pointerTargetY = 0;
  private currentDpr: number;
  private frameAccumulator = 0;
  private frameCount = 0;
  private lastDprChange = 0;
  private reducedStill = 0.04;
  private needsRender = false;
  private lastViewProgress = 0;
  private lastFps = 60;
  private readonly onResize = (): void => this.resize();
  private readonly onPointer = (event: PointerEvent): void => {
    this.pointerTargetX = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointerTargetY = (event.clientY / window.innerHeight) * 2 - 1;
  };
  private readonly onVisibility = (): void => {
    this.paused = document.hidden;
    this.lastTimestamp = performance.now();
  };

  constructor(canvas: HTMLCanvasElement) {
    this.tier = detectTier();
    this.reduced = getMotionPreference() === "reduced";

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.tier.antialias,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.tier.dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.currentDpr = this.tier.dpr;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      37,
      window.innerWidth / window.innerHeight,
      0.1,
      650,
    );
    this.rig = new CameraRig(this.camera);
    this.rig.reset(0);

    this.rocket = createRocket();
    this.scene.add(this.rocket.group);

    this.pad = createPad();
    this.scene.add(this.pad.group);

    this.stars = createStarField(this.tier.starCount);
    this.scene.add(this.stars.points);

    this.smoke = createSmoke(this.tier.smokeCount);
    this.scene.add(this.smoke.points);

    this.smokeCloud = createSmokeCloud(this.tier.name === "high" ? 28 : this.tier.name === "mid" ? 20 : 12);
    this.scene.add(this.smokeCloud.group);

    this.ignitionGlowTexture = createGlowTexture();
    this.ignitionGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.ignitionGlowTexture,
        color: 0xff6a2c,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.ignitionGlow.position.set(0, 1.5, 2.8);
    this.ignitionGlow.scale.set(7, 4, 1);
    this.ignitionGlow.renderOrder = 4;
    this.scene.add(this.ignitionGlow);

    this.padFlash = new THREE.PointLight(0xff7b3a, 0, 32, 2);
    this.padFlash.position.set(0, 2.2, 3);
    this.scene.add(this.padFlash);

    const earthSegments = this.tier.name === "high" ? 88 : this.tier.name === "mid" ? 64 : 44;
    const earthOctaves = this.tier.name === "high" ? 4 : 3;
    this.earth = createEarth(earthSegments, earthOctaves);
    this.scene.add(this.earth.group, this.earth.sunLight, this.earth.sunLight.target);

    this.addLights();
    this.addMoon();

    this.setProgressFromUrl();
    this.resize();
    this.applyProgress();

    if (import.meta.env.DEV) {
      (window as Window & {
        __HALCYON_SMOKE_TOGGLE__?: (on: boolean) => void;
        __HALCYON_EARTH_TOGGLE__?: (on: boolean) => void;
        __HALCYON_STAGE_DEBUG__?: () => unknown;
      }).__HALCYON_SMOKE_TOGGLE__ = (on: boolean) => {
        this.smoke.points.visible = on;
        this.smokeCloud.group.visible = on;
        this.rocket.flame.visible = on;
      };
      (window as Window & { __HALCYON_EARTH_TOGGLE__?: (on: boolean) => void }).__HALCYON_EARTH_TOGGLE__ = (on: boolean) => {
        this.earth.group.visible = on;
      };
      (window as Window & { __HALCYON_STAGE_DEBUG__?: () => unknown }).__HALCYON_STAGE_DEBUG__ = () => ({
        smokeVisible: this.smoke.points.visible,
        smokeIgnition: this.smoke.material.uniforms.uIgnition?.value,
        smokeCount: this.smoke.points.geometry.getAttribute("position").count,
        rocketY: this.rocket.group.position.y,
        progress: this.progress,
        viewProgress: this.lastViewProgress.toFixed(3),
        fps: this.lastFps,
        dpr: this.currentDpr,
        tier: this.tier.name,
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
      });
    }
  }

  private addLights(): void {
    const hemisphere = new THREE.HemisphereLight(0x5c7f9e, 0x07090b, 0.78);
    this.scene.add(hemisphere);

    const moonLight = new THREE.DirectionalLight(0xcfe0ff, 2.15);
    moonLight.position.set(-12, 22, 10);
    this.scene.add(moonLight);

    const rim = new THREE.DirectionalLight(0x5b8db3, 1.25);
    rim.position.set(10, 9, -14);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0xa9c7dd, 2.3);
    fill.position.set(8, 32, 26);
    this.scene.add(fill);

    const warm = new THREE.PointLight(0xff8b4d, 7, 22, 2);
    warm.position.set(-2, 3.4, 5.5);
    this.scene.add(warm);
  }

  private addMoon(): void {
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 24, 16),
      new THREE.MeshStandardMaterial({
        color: 0xb9b3a6,
        roughness: 1,
        metalness: 0,
      }),
    );
    moon.position.set(-52, 44, -138);
    moon.visible = window.innerWidth >= 760;
    this.moon = moon;
    this.scene.add(moon);
  }

  private setProgressFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const requested = Number(params.get("p"));
    if (Number.isFinite(requested)) {
      this.targetProgress = Math.min(1, Math.max(0, requested));
      this.progress = this.targetProgress;
      this.rig.reset(this.progress);
    }
  }

  setProgress(progress: number, immediate = false): void {
    this.targetProgress = Math.min(1, Math.max(0, progress));
    if (immediate) {
      this.progress = this.targetProgress;
      this.rig.reset(this.progress);
      this.applyProgress();
      this.render();
    }
  }

  setReduced(reduced: boolean): void {
    this.reduced = reduced;
    this.needsRender = true;
    if (reduced) {
      this.applyReducedStill();
    } else {
      this.rig.reset(this.progress);
      this.applyProgress();
      this.updateEffects(this.progress);
      this.render();
    }
  }

  setReducedStill(progress: number): void {
    const value = Math.min(1, Math.max(0, progress));
    if (Math.abs(value - this.reducedStill) < 0.0001) return;
    this.reducedStill = value;
    if (!this.reduced) return;
    this.needsRender = true;
    this.applyReducedStill();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    this.lastTimestamp = performance.now();
    gsap.ticker.add(this.tick);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    gsap.ticker.remove(this.tick);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointer);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private readonly tick = (): void => {
    if (!this.running || this.paused) return;

    if (this.reduced) {
      if (this.needsRender) {
        this.needsRender = false;
        this.applyReducedStill();
      }
      return;
    }

    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastTimestamp) / 1000);
    this.lastTimestamp = now;
    this.time += delta;

    const damping = 1 - Math.pow(0.001, delta);
    this.progress += (this.targetProgress - this.progress) * damping;
    this.pointerX += (this.pointerTargetX - this.pointerX) * Math.min(1, delta * 3.8);
    this.pointerY += (this.pointerTargetY - this.pointerY) * Math.min(1, delta * 3.8);

    const viewProgress = this.progress;
    this.applyProgress();
    const throttle = throttleForProgress(viewProgress);
    const ignition = ignitionEnvelope(viewProgress);
    const shake = ignition * 0.12 + (viewProgress > 0.3 && viewProgress < 0.56 ? throttle * 0.022 : 0);
    this.rig.update(
      viewProgress,
      this.time,
      { x: this.pointerX, y: this.pointerY },
      false,
      shake,
    );
    this.updateEffects(viewProgress);
    this.render();

    this.trackPerformance(delta);
  };

  private applyReducedStill(): void {
    const progress = this.reducedStill;
    this.applyProgress();
    this.rig.reset(progress);
    this.updateEffects(progress);
    this.render();
    this.needsRender = false;
  }

  private updateEffects(viewProgress: number): void {
    this.stars.material.uniforms.uTime!.value = this.time;
    this.stars.points.rotation.y = viewProgress * 0.16 + this.time * 0.0025;

    const smokeAmount =
      clamp01((viewProgress - 0.18) / 0.04) * (1 - inverseLerp(0.6, 0.86, viewProgress));
    this.smoke.material.uniforms.uTime!.value = this.time;
    this.smoke.material.uniforms.uIgnition!.value = smokeAmount;
    const showSmoke = !this.reduced && viewProgress < SCENE_EVENTS.padHidden && smokeAmount > 0.002;
    this.smoke.points.visible = showSmoke;
    this.smokeCloud.update(showSmoke ? smokeAmount : 0, this.time);

    const ignition = ignitionEnvelope(viewProgress);
    this.ignitionGlow.material.opacity = this.reduced ? 0 : ignition * 0.85;
    this.ignitionGlow.scale.set(7 + ignition * 3, 4 + ignition * 2, 1);
    this.padFlash.intensity = this.reduced ? 0 : ignition * 120;
    this.earth.update(viewProgress, this.time);
  }

  private applyProgress(): void {
    const progress = this.reduced ? this.reducedStill : this.progress;
    const lift = rocketLiftForProgress(progress);
    const throttle = throttleForProgress(progress) * (progress > 0.16 ? 1 : 0);
    const boosterThrottle =
      throttle *
      (1 -
        inverseLerp(
          SCENE_EVENTS.boosterCutoff.start,
          SCENE_EVENTS.boosterCutoff.end,
          progress,
        ));

    this.rocket.setLift(lift);
    this.rocket.setThrottle(boosterThrottle, this.time);

    const vibration = this.reduced ? 0 : ignitionEnvelope(progress);
    this.rocket.group.position.x = Math.sin(this.time * 47.0) * 0.012 * vibration;
    this.rocket.group.rotation.z = Math.sin(this.time * 53.0) * 0.007 * vibration;

    this.pad.group.visible = progress < SCENE_EVENTS.padHidden;

    const separation = inverseLerp(
      SCENE_EVENTS.stageSeparation.start,
      SCENE_EVENTS.stageSeparation.end,
      progress,
    );
    this.rocket.setStageSeparation(separation);
    const fairing = inverseLerp(SCENE_EVENTS.fairing.start, SCENE_EVENTS.fairing.end, progress);
    this.rocket.setFairingOpen(fairing);
    const deploy = inverseLerp(SCENE_EVENTS.payload.start, SCENE_EVENTS.payload.end, progress);
    this.rocket.setSatelliteDeploy(deploy);

    this.pad.shadow.material.opacity = 0.72 * (1 - clamp01(lift / 14));
    this.pad.floodlight.intensity = 80 * (1 - clamp01(lift / 20) * 0.4);

    const ignition = ignitionEnvelope(progress);
    if (!this.reduced && ignition > 0.01) {
      this.pad.group.position.x = (Math.random() - 0.5) * ignition * 0.012;
    }

    this.lastViewProgress = progress;
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private trackPerformance(delta: number): void {
    this.frameAccumulator += delta;
    this.frameCount += 1;
    if (this.frameAccumulator < 2.2) return;

    const fps = this.frameCount / this.frameAccumulator;
    this.lastFps = fps;
    this.frameAccumulator = 0;
    this.frameCount = 0;

    if (this.time - this.lastDprChange < 4) return;
    if (fps < 46 && this.currentDpr > 0.86) {
      this.currentDpr = Math.max(0.85, this.currentDpr - 0.15);
      this.renderer.setPixelRatio(this.currentDpr);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.lastDprChange = this.time;
    } else if (fps > 58.5 && this.currentDpr < this.tier.maxDpr) {
      this.currentDpr = Math.min(this.tier.maxDpr, this.currentDpr + 0.1);
      this.renderer.setPixelRatio(this.currentDpr);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.lastDprChange = this.time;
    }
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.moon) this.moon.visible = width >= 760;
    if (this.reduced) {
      this.rig.reset(this.reducedStill);
      this.applyReducedStill();
    } else {
      this.rig.reset(this.progress);
      if (!this.running) this.render();
    }
  }

  dispose(): void {
    this.stop();
    this.rocket.dispose();
    this.pad.dispose();
    this.stars.dispose();
    this.smoke.dispose();
    this.smokeCloud.dispose();
    this.earth.dispose();
    this.ignitionGlowTexture.dispose();
    this.renderer.dispose();
  }
}

export const createStage = (canvas: HTMLCanvasElement): Stage => new Stage(canvas);
