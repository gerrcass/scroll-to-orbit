import * as THREE from "three";
import { createGlowTexture, createLiveryTexture } from "./textures";

export interface KestrelModel {
  group: THREE.Group;
  booster: THREE.Group;
  upper: THREE.Group;
  fairingLeft: THREE.Group;
  fairingRight: THREE.Group;
  satellite: THREE.Group;
  flame: THREE.Group;
  engineLight: THREE.PointLight;
  setThrottle: (throttle: number, time: number) => void;
  setLift: (lift: number) => void;
  setStageSeparation: (amount: number) => void;
  setFairingOpen: (amount: number) => void;
  setSatelliteDeploy: (amount: number) => void;
  dispose: () => void;
}

const flameVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flameFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    float ripple = sin(vUv.y * 28.0 - uTime * 26.0 + sin(vUv.x * 19.0 + uTime * 4.5) * 2.0) * 0.5 + 0.5;
    float edge = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
    float body = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.58, 1.0, vUv.y));
    vec3 color = mix(vec3(1.0, 0.16, 0.015), vec3(1.0, 0.83, 0.48), ripple * 0.9);
    gl_FragColor = vec4(color, (0.2 + ripple * 0.8) * edge * body * uOpacity);
  }
`;

const createFlameMaterial = (): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: flameVertex,
    fragmentShader: flameFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

export const createRocket = (): KestrelModel => {
  const livery = createLiveryTexture();
  const glowTexture = createGlowTexture();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    map: livery,
    color: 0xffffff,
    roughness: 0.56,
    metalness: 0.1,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x111518,
    roughness: 0.45,
    metalness: 0.62,
  });
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f9497,
    roughness: 0.28,
    metalness: 0.88,
  });
  const engineMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3032,
    roughness: 0.34,
    metalness: 0.92,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    roughness: 0.42,
    metalness: 0.2,
    emissive: 0x240700,
  });
  const fairingMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e2d7,
    roughness: 0.62,
    metalness: 0.12,
  });
  const foilMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a54e,
    roughness: 0.36,
    metalness: 0.74,
    emissive: 0x1d0f00,
  });
  const panelMaterial = new THREE.MeshBasicMaterial({
    color: 0x1c2226,
    transparent: true,
    opacity: 0.7,
  });

  const group = new THREE.Group();
  group.name = "Kestrel K-01";

  const booster = new THREE.Group();
  booster.name = "Booster";
  const upper = new THREE.Group();
  upper.name = "Upper stage";

  // ---- booster -----------------------------------------------------------
  const stageOne = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.6, 4.0, 40, 1), bodyMaterial);
  stageOne.position.y = 2.35;
  booster.add(stageOne);

  const interstage = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.4, 40), darkMaterial);
  interstage.position.y = 4.55;
  booster.add(interstage);

  const baseSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.63, 0.36, 40), engineMaterial);
  baseSkirt.position.y = 0.18;
  booster.add(baseSkirt);

  const raceway = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.7, 0.06), panelMaterial);
  raceway.position.set(0.6, 2.34, 0);
  booster.add(raceway);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.592, 0.592, 0.14, 40, 1, true), accentMaterial);
  band.position.y = 3.95;
  booster.add(band);

  const upperRing = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.018, 8, 40), metalMaterial);
  upperRing.rotation.x = Math.PI / 2;
  upperRing.position.y = 4.36;
  booster.add(upperRing);

  // Engine bells.
  const engineOffsets: Array<[number, number]> = [[0, 0]];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    engineOffsets.push([Math.cos(angle) * 0.36, Math.sin(angle) * 0.36]);
  }
  const engineGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xff5a1f });
  const engineBells: THREE.Mesh[] = [];
  for (const [x, z] of engineOffsets) {
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.38, 12, 1, true), engineMaterial);
    bell.rotation.x = Math.PI;
    bell.position.set(x, 0.19, z);
    booster.add(bell);
    engineBells.push(bell);

    const throat = new THREE.Mesh(new THREE.CircleGeometry(0.063, 12), engineGlowMaterial);
    throat.rotation.x = Math.PI / 2;
    throat.position.set(x, 0.005, z);
    booster.add(throat);
  }

  // Grid fins.
  for (const [x, z, rotation] of [
    [0.68, 0, 0],
    [-0.68, 0, 0],
    [0, 0.68, Math.PI / 2],
    [0, -0.68, Math.PI / 2],
  ] as const) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.55), metalMaterial);
    fin.position.set(x, 4.14, z);
    fin.rotation.y = rotation;
    booster.add(fin);

    const finGrid = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.37, 0.48), darkMaterial);
    finGrid.position.set(x * 1.09, 4.14, z * 1.09);
    finGrid.rotation.y = rotation;
    booster.add(finGrid);
  }

  // Stowed landing legs.
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Group();
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.075, 1.55, 0.11), metalMaterial);
    strut.position.y = -0.78;
    leg.add(strut);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.32), darkMaterial);
    foot.position.y = -1.57;
    leg.add(foot);
    leg.position.set(Math.cos(angle) * 0.58, 2.05, Math.sin(angle) * 0.58);
    leg.rotation.z = Math.cos(angle) * -0.08;
    leg.rotation.x = Math.sin(angle) * 0.08;
    booster.add(leg);
  }

  // ---- upper stage -------------------------------------------------------
  const stageTwo = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 2.2, 40), bodyMaterial);
  stageTwo.position.y = 5.85;
  upper.add(stageTwo);

  const upperBand = new THREE.Mesh(new THREE.CylinderGeometry(0.592, 0.592, 0.11, 40, 1, true), accentMaterial);
  upperBand.position.y = 6.8;
  upper.add(upperBand);

  const vacuumBell = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.52, 18, 1, true), engineMaterial);
  vacuumBell.rotation.x = Math.PI;
  vacuumBell.position.y = 4.48;
  upper.add(vacuumBell);

  const rcs = new THREE.Group();
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const thruster = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), metalMaterial);
    thruster.position.set(Math.cos(angle) * 0.6, 6.64, Math.sin(angle) * 0.6);
    rcs.add(thruster);
  }
  upper.add(rcs);

  // Fairing halves, hinged at the vehicle centreline.
  const fairingLeft = new THREE.Group();
  const fairingRight = new THREE.Group();
  const fairingHeight = 1.2;
  const noseHeight = 1.2;

  const makeFairingHalf = (start: number): THREE.Group => {
    const half = new THREE.Group();
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.592, 0.592, fairingHeight, 28, 1, true, start, Math.PI),
      fairingMaterial,
    );
    shell.position.y = 7.55;
    half.add(shell);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.592, noseHeight, 28, 1, true, start, Math.PI),
      fairingMaterial,
    );
    nose.position.y = 8.75;
    half.add(nose);

    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.008, 2.4, 0.012), panelMaterial);
    seam.position.set(start === 0 ? 0.0 : 0.0, 8.15, start === 0 ? 0.592 : -0.592);
    half.add(seam);

    return half;
  };

  fairingLeft.add(makeFairingHalf(0));
  fairingRight.add(makeFairingHalf(Math.PI));
  upper.add(fairingLeft, fairingRight);

  // Payload stack inside the fairing.
  const satellite = new THREE.Group();
  satellite.position.y = 7.38;
  satellite.visible = false;
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.48, 0.4), foilMaterial);
  satellite.add(bus);
  const panelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.015, 0.4), darkMaterial);
  panelLeft.position.set(-0.6, 0, 0);
  satellite.add(panelLeft);
  const panelRight = panelLeft.clone();
  panelRight.position.x = 0.6;
  satellite.add(panelRight);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), metalMaterial);
  dish.position.y = 0.3;
  satellite.add(dish);
  upper.add(satellite);

  group.add(booster, upper);

  // ---- flame and engine light -------------------------------------------
  const flame = new THREE.Group();
  const outerFlameMaterial = createFlameMaterial();
  const innerFlameMaterial = createFlameMaterial();

  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 2.7, 24, 1, true),
    outerFlameMaterial,
  );
  outerFlame.rotation.x = Math.PI;
  outerFlame.position.y = -1.34;
  outerFlame.renderOrder = 5;
  flame.add(outerFlame);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 1.65, 18, 1, true),
    innerFlameMaterial,
  );
  innerFlame.rotation.x = Math.PI;
  innerFlame.position.y = -0.82;
  innerFlame.renderOrder = 6;
  flame.add(innerFlame);

  const engineGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff6a2c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  engineGlow.scale.set(2.3, 2.3, 1);
  engineGlow.position.y = -0.1;
  flame.add(engineGlow);

  const engineLight = new THREE.PointLight(0xff5a1f, 0, 24, 1.8);
  engineLight.position.y = -0.2;

  group.add(flame, engineLight);

  // A soft highlight down the body pushes the silhouette away from the sky.
  const highlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.583, 0.6, 3.95, 32, 1, true, -0.7, 0.34),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  highlight.position.y = 2.35;
  booster.add(highlight);

  const setThrottle = (throttle: number, time: number): void => {
    const value = Math.max(0, Math.min(1, throttle));
    const visible = value > 0.015;
    flame.visible = visible;
    outerFlameMaterial.uniforms.uTime!.value = time;
    innerFlameMaterial.uniforms.uTime!.value = time;
    outerFlameMaterial.uniforms.uOpacity!.value = visible ? 0.72 + value * 0.28 : 0;
    innerFlameMaterial.uniforms.uOpacity!.value = visible ? 0.85 * value : 0;
    outerFlame.scale.set(0.72 + value * 0.38, 0.55 + value * 0.75, 0.72 + value * 0.38);
    innerFlame.scale.set(0.72 + value * 0.3, 0.7 + value * 0.55, 0.72 + value * 0.3);
    engineLight.intensity = visible ? 22 + value * 42 : 0;
    engineGlow.material.opacity = visible ? 0.28 + value * 0.5 : 0;
    engineGlow.scale.setScalar(1.7 + value * 1.4);
    engineGlow.scale.z = 1;
  };

  const setLift = (lift: number): void => {
    group.position.y = 0.55 + lift;
  };

  const setStageSeparation = (amount: number): void => {
    const t = Math.max(0, Math.min(1, amount));
    booster.position.set(t * 1.9, -t * 2.3, t * 0.6);
    booster.rotation.z = t * 0.22;
    booster.rotation.x = t * -0.16;
  };

  const setFairingOpen = (amount: number): void => {
    const t = Math.max(0, Math.min(1, amount));
    fairingLeft.rotation.z = -t * 1.15;
    fairingRight.rotation.z = t * 1.15;
    fairingLeft.position.x = -t * 0.24;
    fairingRight.position.x = t * 0.24;
  };

  const setSatelliteDeploy = (amount: number): void => {
    const t = Math.max(0, Math.min(1, amount));
    satellite.visible = t > 0.01;
    satellite.position.y = 7.38 + t * 1.3;
    satellite.rotation.y = t * 1.4;
    satellite.scale.setScalar(0.7 + t * 0.3);
    panelLeft.scale.x = 0.4 + t * 0.6;
    panelRight.scale.x = 0.4 + t * 0.6;
  };

  const dispose = (): void => {
    livery.dispose();
    glowTexture.dispose();
    bodyMaterial.dispose();
    darkMaterial.dispose();
    metalMaterial.dispose();
    engineMaterial.dispose();
    accentMaterial.dispose();
    fairingMaterial.dispose();
    foilMaterial.dispose();
    panelMaterial.dispose();
    engineGlowMaterial.dispose();
    outerFlameMaterial.dispose();
    innerFlameMaterial.dispose();
    engineBells.length = 0;
  };

  return {
    group,
    booster,
    upper,
    fairingLeft,
    fairingRight,
    satellite,
    flame,
    engineLight,
    setThrottle,
    setLift,
    setStageSeparation,
    setFairingOpen,
    setSatelliteDeploy,
    dispose,
  };
};
