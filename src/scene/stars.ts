import * as THREE from "three";

export interface StarField {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  dispose: () => void;
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vTwinkle;
  varying vec3 vColor;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float distanceScale = 180.0 / max(1.0, -viewPosition.z);
    gl_PointSize = aSize * uPixelRatio * clamp(distanceScale, 0.8, 3.8);

    vTwinkle = 0.7 + 0.3 * sin(uTime * 0.55 + aSeed * 6.283 + position.x * 0.004);
    vColor = aColor;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vTwinkle;
  varying vec3 vColor;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.08, distanceToCenter);
    gl_FragColor = vec4(vColor, alpha * vTwinkle);
  }
`;

export const createStarField = (count: number): StarField => {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const random = (() => {
    let state = 777;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  })();

  const palette = [
    new THREE.Color(0xe9f0ff),
    new THREE.Color(0xf5efe2),
    new THREE.Color(0xb9d2ea),
    new THREE.Color(0xffe3c7),
  ];

  for (let index = 0; index < count; index += 1) {
    const radius = 72 + random() * 180;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const sinPhi = Math.sin(phi);

    positions[index * 3] = radius * sinPhi * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi) * 0.74 + 16;
    positions[index * 3 + 2] = radius * sinPhi * Math.sin(theta);

    const bright = random();
    sizes[index] = 1.05 + bright * bright * 3.8;
    seeds[index] = random();

    const color = palette[Math.floor(random() * palette.length)] ?? palette[0]!;
    const tint = 0.82 + random() * 0.28;
    colors[index * 3] = color.r * tint;
    colors[index * 3 + 1] = color.g * tint;
    colors[index * 3 + 2] = color.b * tint;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -10;

  return {
    points,
    material,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
