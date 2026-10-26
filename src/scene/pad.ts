import * as THREE from "three";
import { createDeckTexture, createGlowTexture, createShadowTexture } from "./textures";

export interface PadModel {
  group: THREE.Group;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  floodlight: THREE.SpotLight;
  dispose: () => void;
}

const box = (
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
): THREE.Mesh => new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);

const brace = (
  from: THREE.Vector3,
  to: THREE.Vector3,
  thickness: number,
  material: THREE.Material,
): THREE.Mesh => {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, thickness, thickness), material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.normalize());
  return mesh;
};

export const createPad = (): PadModel => {
  const group = new THREE.Group();
  group.name = "Pad 09";

  const deckTexture = createDeckTexture();
  const glowTexture = createGlowTexture();
  const shadowTexture = createShadowTexture();

  const concrete = new THREE.MeshStandardMaterial({
    color: 0x191d20,
    roughness: 0.96,
    metalness: 0.02,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x202427,
    roughness: 0.52,
    metalness: 0.72,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x3e4346,
    roughness: 0.46,
    metalness: 0.62,
  });
  const warmLamp = new THREE.MeshBasicMaterial({ color: 0xffd2a2 });
  const redLamp = new THREE.MeshBasicMaterial({ color: 0xff3614 });
  const paint = new THREE.MeshBasicMaterial({
    color: 0xb9b3a6,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });

  // Ground and deck.
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(130, 72),
    new THREE.MeshStandardMaterial({ color: 0x070a0d, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.015;
  group.add(ground);

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(6.3, 6.7, 0.34, 64), concrete);
  deck.position.y = 0.17;
  group.add(deck);

  const deckTop = new THREE.Mesh(
    new THREE.CircleGeometry(6.26, 64),
    new THREE.MeshStandardMaterial({
      map: deckTexture,
      roughness: 0.9,
      metalness: 0.04,
      transparent: true,
      opacity: 0.96,
    }),
  );
  deckTop.rotation.x = -Math.PI / 2;
  deckTop.position.y = 0.345;
  group.add(deckTop);

  const padRing = new THREE.Mesh(new THREE.RingGeometry(4.7, 4.74, 64), paint);
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.y = 0.36;
  group.add(padRing);

  // Launch mount.
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    const mount = box(0.34, 0.9, 0.34, darkMetal);
    mount.position.set(Math.cos(angle) * 1.24, 0.79, Math.sin(angle) * 1.24);
    group.add(mount);
  }
  const mountRing = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.08, 8, 32), steel);
  mountRing.rotation.x = Math.PI / 2;
  mountRing.position.y = 1.18;
  group.add(mountRing);

  // Service tower.
  const towerX = -3.65;
  const towerZ = -1.15;
  const towerHeight = 10.4;
  const legs = [
    [-0.38, -0.38],
    [0.38, -0.38],
    [-0.38, 0.38],
    [0.38, 0.38],
  ] as const;
  for (const [x, z] of legs) {
    const leg = box(0.14, towerHeight, 0.14, steel);
    leg.position.set(towerX + x, towerHeight / 2, towerZ + z);
    group.add(leg);
  }
  for (let level = 0.7; level < towerHeight; level += 1.1) {
    const ring = box(0.92, 0.07, 0.92, darkMetal);
    ring.position.set(towerX, level, towerZ);
    group.add(ring);
    const crossA = brace(
      new THREE.Vector3(towerX - 0.38, level, towerZ - 0.38),
      new THREE.Vector3(towerX + 0.38, level + 1.1, towerZ - 0.38),
      0.035,
      steel,
    );
    const crossB = brace(
      new THREE.Vector3(towerX - 0.38, level, towerZ + 0.38),
      new THREE.Vector3(towerX + 0.38, level + 1.1, towerZ + 0.38),
      0.035,
      steel,
    );
    group.add(crossA, crossB);
  }

  // Service arms reaching toward the vehicle.
  for (const [height, length] of [
    [4.9, 2.55],
    [6.3, 2.2],
    [7.7, 1.85],
  ] as const) {
    const arm = box(length, 0.09, 0.16, steel);
    arm.position.set(towerX + length / 2 + 0.38, height, towerZ + 0.28);
    group.add(arm);
    const tip = box(0.16, 0.48, 0.16, darkMetal);
    tip.position.set(towerX + length + 0.38, height - 0.2, towerZ + 0.28);
    group.add(tip);
  }

  // Tower beacon.
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), redLamp);
  beacon.position.set(towerX, towerHeight + 0.14, towerZ);
  group.add(beacon);
  const beaconGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff3a16,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beaconGlow.scale.set(1.4, 1.4, 1);
  beaconGlow.position.copy(beacon.position);
  group.add(beaconGlow);

  // Perimeter lights.
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), warmLamp);
    light.position.set(Math.cos(angle) * 6.05, 0.4, Math.sin(angle) * 6.05);
    group.add(light);
  }

  // Contact shadow.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.37;
  group.add(shadow);

  // A warm haze at the horizon, separating pad from sky.
  const haze = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff7b39,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  haze.scale.set(62, 18, 1);
  haze.position.set(-18, 4.8, -58);
  group.add(haze);

  const floodlight = new THREE.SpotLight(0xffc9a0, 80, 38, Math.PI / 5.4, 0.55, 1.8);
  floodlight.position.set(6.8, 5.2, 4.4);
  floodlight.target.position.set(0, 5.2, 0);
  group.add(floodlight, floodlight.target);

  const dispose = (): void => {
    deckTexture.dispose();
    glowTexture.dispose();
    shadowTexture.dispose();
    ground.geometry.dispose();
    deck.geometry.dispose();
    deckTop.geometry.dispose();
    padRing.geometry.dispose();
    shadow.geometry.dispose();
    concrete.dispose();
    darkMetal.dispose();
    steel.dispose();
    warmLamp.dispose();
    redLamp.dispose();
    paint.dispose();
  };

  return { group, shadow, floodlight, dispose };
};
