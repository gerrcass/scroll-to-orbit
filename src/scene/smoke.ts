import * as THREE from "three";

export interface SmokeSystem {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  dispose: () => void;
}

const vertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;

  uniform float uTime;
  uniform float uIgnition;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vShade;
  varying float vSeed;

  void main() {
    vec3 pos = position;
    float expand = uIgnition;

    pos.xz *= 1.0 + expand * (0.9 + aSeed * 1.8);
    pos.y += expand * (0.35 + aSeed * 2.2) + sin(uTime * 0.34 + aSeed * 9.0) * 0.18 * expand;
    pos.x += sin(uTime * 0.42 + aSeed * 7.0) * 0.22 * expand;
    pos.z += cos(uTime * 0.37 + aSeed * 11.0) * 0.22 * expand;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * clamp(130.0 / max(1.0, -mv.z), 0.7, 4.4) * (0.55 + expand * 0.8);

    vAlpha = expand * (0.14 + aSeed * 0.3);
    vShade = aSeed;
    vSeed = aSeed;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vShade;
  varying float vSeed;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float cloud = noise(gl_PointCoord * 4.6 + vSeed * 19.0);
    float alpha = smoothstep(0.5, 0.06, distanceToCenter) * (0.38 + 0.62 * cloud);
    vec3 color = mix(vec3(0.62, 0.44, 0.25), vec3(0.95, 0.84, 0.65), vShade);
    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

export const createSmoke = (count: number): SmokeSystem => {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);

  const random = (() => {
    let state = 91;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  })();

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 0.65 + Math.pow(random(), 0.72) * 5.6;
    const y = 0.42 + random() * 0.7;

    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = Math.sin(angle) * radius;
    seeds[index] = random();
    sizes[index] = 0.65 + random() * 1.7;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIgnition: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 3;

  return {
    points,
    material,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
