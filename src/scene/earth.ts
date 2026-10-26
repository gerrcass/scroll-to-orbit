import * as THREE from "three";
import { createGlowTexture } from "./textures";

export interface EarthModel {
  group: THREE.Group;
  sunLight: THREE.DirectionalLight;
  update: (progress: number, time: number) => void;
  dispose: () => void;
}

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const earthFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSunrise;
  uniform vec3 uSunDirection;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int index = 0; index < 4; index += 1) {
      value += amplitude * noise(p);
      p = p * 2.03 + 7.1;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec2 uv = vUv;

    float lands = smoothstep(0.5, 0.63, fbm(uv * vec2(7.0, 4.0) + vec2(1.3, 0.4)));
    float clouds = smoothstep(0.53, 0.69, fbm(uv * vec2(12.0, 6.2) + vec2(3.1, 1.7) + uTime * 0.0015));
    float cities = smoothstep(0.63, 0.79, fbm(uv * vec2(46.0, 23.0) + 7.0)) * lands;

    vec3 ocean = vec3(0.006, 0.026, 0.052);
    vec3 land = mix(vec3(0.035, 0.07, 0.052), vec3(0.115, 0.125, 0.082), fbm(uv * vec2(16.0, 8.0)));
    vec3 base = mix(ocean, land, lands);

    float sunDot = dot(normal, normalize(uSunDirection));
    float day = smoothstep(-0.18, 0.34, sunDot);
    float night = 1.0 - day;

    vec3 color = base * mix(0.045, 1.0, day);
    color = mix(color, vec3(0.72, 0.79, 0.82) * mix(0.13, 1.0, day), clouds * 0.52);
    color += vec3(1.0, 0.48, 0.19) * cities * night * 0.95;

    float terminator = exp(-pow((sunDot - 0.015) * 3.8, 2.0));
    color += vec3(1.0, 0.32, 0.09) * terminator * (0.22 + uSunrise * 0.55);

    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.3);
    vec3 rim = mix(vec3(0.16, 0.4, 0.72), vec3(1.0, 0.4, 0.14), uSunrise * 0.72);
    color += rim * fresnel * (0.6 + uSunrise * 0.5);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform float uSunrise;

  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - abs(dot(normal, viewDir)), 2.1);
    vec3 color = mix(vec3(0.16, 0.4, 0.72), vec3(1.0, 0.38, 0.12), uSunrise);
    gl_FragColor = vec4(color, rim * (0.42 + uSunrise * 0.25));
  }
`;

export const createEarth = (segments = 72): EarthModel => {
  const group = new THREE.Group();
  group.name = "Earth";
  group.position.set(0, -230, -150);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(180, segments, Math.max(32, segments / 2)),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunrise: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(0.82, 0.26, 0.55).normalize() },
      },
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
      toneMapped: false,
    }),
  );
  group.add(sphere);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(183.6, segments, Math.max(32, segments / 2)),
    new THREE.ShaderMaterial({
      uniforms: {
        uSunrise: { value: 0 },
      },
      vertexShader: atmosphereVertex,
      fragmentShader: atmosphereFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  group.add(atmosphere);

  const glowTexture = createGlowTexture();
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff7a3c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sunGlow.scale.set(120, 120, 1);
  sunGlow.position.set(210, -80, -242);
  sunGlow.renderOrder = 20;
  group.add(sunGlow);

  const sunDisc = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffe0b4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sunDisc.scale.set(24, 24, 1);
  sunDisc.position.copy(sunGlow.position);
  sunDisc.renderOrder = 21;
  group.add(sunDisc);

  const sunLight = new THREE.DirectionalLight(0xff9a5a, 0);
  sunLight.position.set(80, 78, 60);
  sunLight.target.position.set(0, 40, 0);

  const update = (progress: number, time: number): void => {
    const reveal = Math.min(1, Math.max(0, (progress - 0.54) / 0.32));
    const easedReveal = reveal * reveal * (3 - 2 * reveal);
    group.visible = progress > 0.54;
    group.position.y = -230 + easedReveal * 80;
    sphere.rotation.y = time * 0.0035;

    const sunrise = Math.min(1, Math.max(0, (progress - 0.86) / 0.13));
    const easedSunrise = sunrise * sunrise * (3 - 2 * sunrise);
    sphere.material.uniforms.uTime!.value = time;
    sphere.material.uniforms.uSunrise!.value = easedSunrise;
    atmosphere.material.uniforms.uSunrise!.value = easedSunrise;
    sunGlow.material.opacity = easedSunrise * 0.62;
    sunDisc.material.opacity = easedSunrise * 0.95;
    sunGlow.scale.setScalar(90 + easedSunrise * 50);
    sunDisc.scale.setScalar(18 + easedSunrise * 10);
    sunLight.intensity = easedSunrise * 3.2;
  };

  const dispose = (): void => {
    sphere.geometry.dispose();
    sphere.material.dispose();
    atmosphere.geometry.dispose();
    atmosphere.material.dispose();
    sunGlow.material.dispose();
    sunDisc.material.dispose();
    glowTexture.dispose();
  };

  return { group, sunLight, update, dispose };
};
