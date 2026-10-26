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
    emissive: 0x3a3023,
    emissiveIntensity: 0.95,
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
    emissive: 0x332b1f,
    emissiveIntensity: 0.85,
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
    new THREE.ConeGeometry(0.58, 3.4, 24, 1, true),
    outerFlameMaterial,
  );
  outerFlame.rotation.x = Math.PI;
  outerFlame.position.y = -1.7;
  outerFlame.renderOrder = 5;
  flame.add(outerFlame);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 2.05, 18, 1, true),
    innerFlameMaterial,
  );
  innerFlame.rotation.x = Math.PI;
  innerFlame.position.y = -1.02;
  innerFlame.renderOrder = 6;
  flame.add(innerFlame);

  const engineGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff6a2c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  engineGlow.scale.set(4.2, 4.2, 1);
  engineGlow.position.y = -0.18;
  engineGlow.renderOrder = 7;
  flame.add(engineGlow);

  const plumeOuter = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff5a1f,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  plumeOuter.scale.set(2.8, 5.8, 1);
  plumeOuter.position.y = -1.3;
  plumeOuter.renderOrder = 8;
  flame.add(plumeOuter);

  const plumeInner = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffd7a8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  plumeInner.scale.set(1.1, 3.6, 1);
  plumeInner.position.y = -1.0;
  plumeInner.renderOrder = 9;
  flame.add(plumeInner);

  const engineLight = new THREE.PointLight(0xff5a1f, 0, 24, 1.8);
  engineLight.position.y = -0.2;

  booster.add(flame, engineLight);

  const upperFlame = new THREE.Group();
  const upperGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff6a2c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  upperGlow.scale.set(1.4, 2.4, 1);
  upperGlow.position.y = 4.16;
  upperGlow.renderOrder = 9;
  const upperCore = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffd7a8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  upperCore.scale.set(0.7, 1.7, 1);
  upperCore.position.y = 4.12;
  upperCore.renderOrder = 10;
  upperFlame.add(upperGlow, upperCore);
  upperFlame.visible = false;
  upper.add(upperFlame);

  const upperLight = new THREE.PointLight(0xff6a2c, 0, 10, 1.8);
  upperLight.position.y = 4.1;
  upper.add(upperLight);

  const separationFlash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffe3c2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  separationFlash.scale.set(4, 3, 1);
  separationFlash.position.y = 4.35;
  separationFlash.renderOrder = 11;
  separationFlash.visible = false;
  group.add(separationFlash);

  const separationLight = new THREE.PointLight(0xffd7a8, 0, 20, 1.8);
  separationLight.position.y = 4.35;
  group.add(separationLight);

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
    outerFlame.scale.set(0.82 + value * 0.46, 0.62 + value * 0.94, 0.82 + value * 0.46);
    innerFlame.scale.set(0.8 + value * 0.34, 0.72 + value * 0.62, 0.8 + value * 0.34);
    const flicker = 0.92 + Math.sin(time * 41.0) * 0.08 + Math.sin(time * 67.0) * 0.04;
    engineLight.intensity = visible ? (36 + value * 78) * flicker : 0;
    engineGlow.material.opacity = visible ? 0.38 + value * 0.58 : 0;
    engineGlow.scale.set(3.2 + value * 2.6, 3.2 + value * 2.6, 1);
    plumeOuter.material.opacity = visible ? 0.4 + value * 0.5 : 0;
    plumeOuter.scale.set(
      (2.2 + value * 1.4) * (1 + Math.sin(time * 23.0) * 0.05),
      4.6 + value * 2.8,
      1,
    );
    plumeOuter.position.x = Math.sin(time * 17.0) * 0.08;
    plumeInner.material.opacity = visible ? 0.36 + value * 0.4 : 0;
    plumeInner.scale.set(
      (0.9 + value * 0.7) * (1 + Math.sin(time * 29.0) * 0.06),
      3.0 + value * 1.6,
      1,
    );
    plumeInner.position.x = Math.sin(time * 21.0 + 1.0) * 0.05;
  };

  const setLift = (lift: number): void => {
    group.position.y = 0.55 + lift;
  };

  const setStageSeparation = (amount: number): void => {
    const t = Math.max(0, Math.min(1, amount));
    booster.position.set(t * 4.0, -t * 11.0, t * 2.2);
    booster.rotation.z = t * 0.62;
    booster.rotation.x = t * -0.38;

    const flash = Math.sin(t * Math.PI);
    separationFlash.visible = flash > 0.01;
    separationFlash.material.opacity = flash;
    separationFlash.scale.set(4.2 + flash * 2.4, 2.6 + flash * 1.8, 1);
    separationLight.intensity = flash * 45;

    const upperIgnition = Math.max(0, Math.min(1, (t - 0.35) / 0.3));
    upperFlame.visible = upperIgnition > 0.01;
    upperGlow.material.opacity = upperIgnition * 0.75;
    upperCore.material.opacity = upperIgnition * 0.88;
    upperGlow.scale.set(1.2 + upperIgnition * 0.6, 2.2 + upperIgnition * 1.4, 1);
    upperCore.scale.set(0.6 + upperIgnition * 0.3, 1.6 + upperIgnition * 1.0, 1);
    upperLight.intensity = upperIgnition * 30;
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
    upperGlow.material.dispose();
    upperCore.material.dispose();
    separationFlash.material.dispose();
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
