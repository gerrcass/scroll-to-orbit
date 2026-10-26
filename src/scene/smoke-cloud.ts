import * as THREE from "three";
import { createSmokeTexture } from "./textures";

interface Puff {
  sprite: THREE.Sprite;
  baseX: number;
  baseY: number;
  baseZ: number;
  seed: number;
  size: number;
  spin: number;
}

export interface SmokeCloud {
  group: THREE.Group;
  update: (amount: number, time: number) => void;
  dispose: () => void;
}

export const createSmokeCloud = (count = 22): SmokeCloud => {
  const texture = createSmokeTexture();
  const group = new THREE.Group();
  group.name = "Ignition smoke";
  const puffs: Puff[] = [];
  const random = (() => {
    let state = 812;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  })();

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 0.6 + random() * 7.2;
    const seed = random();
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color().setHSL(0.075, 0.05, 0.36 + seed * 0.2),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });
    const sprite = new THREE.Sprite(material);
    const size = 2.6 + random() * 4.6;
    sprite.scale.set(size, size * (0.7 + random() * 0.5), 1);
    const baseX = Math.cos(angle) * radius;
    const baseY = 0.2 + random() * 0.9;
    const baseZ = Math.sin(angle) * radius;
    sprite.position.set(baseX, baseY, baseZ);
    sprite.renderOrder = 2;
    group.add(sprite);
    puffs.push({
      sprite,
      baseX,
      baseY,
      baseZ,
      seed,
      size,
      spin: (random() - 0.5) * 0.12,
    });
  }

  const update = (amount: number, time: number): void => {
    const value = Math.max(0, Math.min(1, amount));
    group.visible = value > 0.005;
    if (!group.visible) return;

    for (const puff of puffs) {
      const spread = 1 + value * (0.12 + puff.seed * 0.22);
      const rise = value * (0.2 + puff.seed * 1.15);
      puff.sprite.position.set(
        puff.baseX * spread + Math.sin(time * 0.22 + puff.seed * 9.0) * 0.16,
        puff.baseY + rise + Math.sin(time * 0.18 + puff.seed * 5.0) * 0.12,
        puff.baseZ * spread + Math.cos(time * 0.19 + puff.seed * 7.0) * 0.16,
      );
      const scale = puff.size * (0.58 + value * (0.6 + puff.seed * 0.35));
      puff.sprite.scale.set(scale, scale * (0.72 + puff.seed * 0.35), 1);
      puff.sprite.material.rotation = puff.spin * time;
      puff.sprite.material.opacity = value * (0.22 + puff.seed * 0.24);
    }
  };

  return {
    group,
    update,
    dispose: () => {
      puffs.forEach((puff) => puff.sprite.material.dispose());
      texture.dispose();
    },
  };
};
