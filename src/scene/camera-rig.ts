import * as THREE from "three";
import { cameraForProgressInto } from "../mission/camera";
import type { CameraKey } from "../mission/types";

export interface PointerState {
  x: number;
  y: number;
}

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;

  private readonly position = new THREE.Vector3();
  private readonly lookAt = new THREE.Vector3();
  private readonly drift = new THREE.Vector3();
  private readonly targetDrift = new THREE.Vector3();
  private readonly key: CameraKey = {
    progress: 0,
    position: [0, 0, 0],
    lookAt: [0, 0, 0],
    fov: 37,
    roll: 0,
  };

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(
    progress: number,
    time: number,
    pointer: PointerState,
    reducedMotion: boolean,
    shake = 0,
  ): void {
    const key = cameraForProgressInto(progress, this.key);
    const calm = reducedMotion ? 0 : 1;
    const portrait = Math.min(1, Math.max(0, (0.98 - this.camera.aspect) / 0.55));
    const distanceScale = 1 + portrait * 0.56;

    this.targetDrift.set(
      pointer.x * 0.5 * calm + Math.sin(time * 0.17) * 0.08 * calm,
      pointer.y * 0.32 * calm + Math.cos(time * 0.13) * 0.05 * calm,
      0,
    );
    this.drift.lerp(this.targetDrift, 0.04);

    const shakeX = reducedMotion ? 0 : (Math.sin(time * 47.3) + Math.sin(time * 31.7) * 0.5) * shake;
    const shakeY = reducedMotion ? 0 : (Math.cos(time * 41.1) + Math.sin(time * 27.3) * 0.5) * shake * 0.7;

    this.position.set(
      (key.position[0] + this.drift.x + shakeX) * (1 + portrait * 0.06),
      key.position[1] + this.drift.y + portrait * 1.1 + shakeY,
      (key.position[2] + this.drift.z) * distanceScale,
    );
    this.lookAt.set(
      key.lookAt[0] * (1 - portrait) - 0.55 * portrait + this.drift.x * 0.45 + shakeX * 0.5,
      key.lookAt[1] + this.drift.y * 0.45 + portrait * 0.4 + shakeY * 0.5,
      key.lookAt[2],
    );

    this.camera.position.copy(this.position);
    this.camera.lookAt(this.lookAt);

    const roll = key.roll + (reducedMotion ? 0 : Math.sin(time * 0.11) * 0.003);
    this.camera.rotation.z = roll;

    if (Math.abs(this.camera.fov - key.fov) > 0.01) {
      this.camera.fov = key.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  reset(progress: number): void {
    const key = cameraForProgressInto(progress, this.key);
    this.camera.position.set(key.position[0], key.position[1], key.position[2]);
    this.camera.lookAt(key.lookAt[0], key.lookAt[1], key.lookAt[2]);
    this.camera.rotation.z = key.roll;
    this.camera.fov = key.fov;
    this.camera.updateProjectionMatrix();
  }
}
