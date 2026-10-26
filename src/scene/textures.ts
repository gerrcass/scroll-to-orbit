import * as THREE from "three";

const seeded = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const canvas = (width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  return [element, context];
};

export const createLiveryTexture = (): THREE.CanvasTexture => {
  const [element, context] = canvas(1024, 512);
  const random = seeded(1969);

  context.fillStyle = "#ded8cc";
  context.fillRect(0, 0, 1024, 512);

  // Subtle panel variation.
  for (let index = 0; index < 420; index += 1) {
    const alpha = random() * 0.035;
    context.fillStyle = `rgba(20, 24, 28, ${alpha})`;
    context.fillRect(random() * 1024, random() * 512, 1 + random() * 5, 1 + random() * 2);
  }

  // Panel seams.
  context.strokeStyle = "rgba(35, 40, 44, 0.24)";
  context.lineWidth = 1;
  for (let y = 42; y < 512; y += 64) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(1024, y);
    context.stroke();
  }
  for (let x = 128; x < 1024; x += 128) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 512);
    context.stroke();
  }

  // Orange identification band.
  context.fillStyle = "#ff5a1f";
  context.fillRect(0, 402, 1024, 34);
  context.fillStyle = "rgba(5, 7, 10, 0.18)";
  context.fillRect(0, 402, 1024, 3);

  // Registration marks and fine print.
  context.fillStyle = "rgba(30, 34, 38, 0.66)";
  context.font = "500 18px 'JetBrains Mono', monospace";
  context.letterSpacing = "4px";
  context.fillText("HALCYON", 76, 150);
  context.fillText("KESTREL", 76, 186);
  context.font = "400 12px 'JetBrains Mono', monospace";
  context.letterSpacing = "3px";
  context.fillText("K-01 / FLIGHT VEHICLE", 76, 216);
  context.fillText("ATLANTIC RANGE", 76, 372);

  // A small orbital mark.
  context.strokeStyle = "rgba(30, 34, 38, 0.7)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(905, 156, 33, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.ellipse(905, 156, 52, 18, -0.48, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#ff5a1f";
  context.beginPath();
  context.arc(948, 136, 5, 0, Math.PI * 2);
  context.fill();

  // Rivets.
  context.fillStyle = "rgba(40, 44, 48, 0.34)";
  for (let x = 24; x < 1024; x += 64) {
    context.beginPath();
    context.arc(x, 320, 1.4, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
};

export const createGlowTexture = (): THREE.CanvasTexture => {
  const [element, context] = canvas(256, 256);
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(255,255,255,0.86)");
  gradient.addColorStop(0.46, "rgba(255,255,255,0.26)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const createShadowTexture = (): THREE.CanvasTexture => {
  const [element, context] = canvas(256, 256);
  const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 128);
  gradient.addColorStop(0, "rgba(0,0,0,0.82)");
  gradient.addColorStop(0.42, "rgba(0,0,0,0.4)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const createDeckTexture = (): THREE.CanvasTexture => {
  const [element, context] = canvas(512, 512);
  const random = seeded(9);
  context.fillStyle = "#181c1f";
  context.fillRect(0, 0, 512, 512);
  for (let index = 0; index < 1400; index += 1) {
    const value = 22 + Math.floor(random() * 18);
    context.fillStyle = `rgb(${value}, ${value + 2}, ${value + 3})`;
    context.fillRect(random() * 512, random() * 512, 1 + random() * 4, 1 + random() * 3);
  }
  context.strokeStyle = "rgba(242, 238, 229, 0.16)";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(256, 256, 188, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 2;
  context.setLineDash([14, 18]);
  context.beginPath();
  context.arc(256, 256, 152, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = "rgba(242, 238, 229, 0.22)";
  context.font = "500 32px 'JetBrains Mono', monospace";
  context.fillText("09", 224, 124);
  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
