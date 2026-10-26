import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, type Page } from "@playwright/test";

const url = "http://127.0.0.1:4173/";
const evidenceDir = "docs/evidence";

const waitForServer = async (): Promise<void> => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Vite preview did not start in time.");
};

const waitForStory = async (page: Page): Promise<void> => {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2400);
};

const sectionTop = async (page: Page, id: string): Promise<number> =>
  page.evaluate((sectionId) => {
    const section = document.getElementById(sectionId);
    return section ? section.getBoundingClientRect().top + window.scrollY : 0;
  }, id);

const scrollTo = async (page: Page, top: number): Promise<void> => {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  await page.waitForTimeout(1500);
};

const capture = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: `${evidenceDir}/${name}.png` });
  console.log(`Captured ${evidenceDir}/${name}.png`);
};

const createOgImage = async (): Promise<void> => {
  const sunrise = await readFile(`${evidenceDir}/scene-sunrise.png`);
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #05070a; }
          img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .9; }
          .veil { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(5,7,10,.94) 0%, rgba(5,7,10,.6) 42%, rgba(5,7,10,.06) 78%), linear-gradient(0deg, rgba(5,7,10,.86), transparent 50%); }
          .frame { position: absolute; inset: 34px; border: 1px solid rgba(242,238,229,.18); }
          .brand { position: absolute; top: 62px; left: 64px; color: #f2eee5; font-family: 'JetBrains Mono', monospace; font-size: 13px; letter-spacing: .28em; }
          .brand span { color: #ff5a1f; }
          .meta { position: absolute; top: 62px; right: 64px; color: #9fc4dd; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .2em; text-align: right; line-height: 1.8; }
          h1 { position: absolute; left: 64px; bottom: 92px; margin: 0; color: #f2eee5; font-family: 'Instrument Serif', Georgia, serif; font-size: 94px; line-height: .88; letter-spacing: -.025em; font-weight: 400; }
          h1 em { color: #ff5a1f; font-style: italic; }
          .foot { position: absolute; left: 66px; bottom: 56px; color: #9ba0a5; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .18em; }
        </style>
      </head>
      <body>
        <img src="data:image/png;base64,${sunrise.toString("base64")}" alt="">
        <div class="veil"></div>
        <div class="frame"></div>
        <div class="brand">HALCYON <span>/</span> LAUNCH SYSTEMS</div>
        <div class="meta">VESPER-01 / ORBITAL SUNRISE<br>SCROLL-DRIVEN FLIGHT</div>
        <h1>The last quiet<br><em>before orbit.</em></h1>
        <div class="foot">A THREE.JS + GSAP MISSION STORY</div>
      </body>
    </html>
  `);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(400);
  const image = await page.screenshot({ type: "png" });
  await writeFile("public/og.png", image);
  console.log("Captured public/og.png");
  await page.close();
};

const browser = await chromium.launch({
  args: ["--enable-gpu", "--ignore-gpu-blocklist"],
});
const preview = spawn(
  "pnpm",
  ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
  { stdio: "ignore" },
);

try {
  await mkdir(evidenceDir, { recursive: true });
  await waitForServer();

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await desktop.newPage();
  await page.goto(url);
  await waitForStory(page);
  await capture(page, "hero");

  const mission = await sectionTop(page, "mission");
  const ascent = await sectionTop(page, "ascent");
  const separation = await sectionTop(page, "separation");
  const orbit = await sectionTop(page, "orbit");
  const contact = await sectionTop(page, "contact");

  await scrollTo(page, mission + 760);
  await capture(page, "ignition");

  await scrollTo(page, ascent);
  await capture(page, "ascent");

  await scrollTo(page, separation + 460);
  await capture(page, "separation");

  await scrollTo(page, orbit + 400);
  await capture(page, "orbit");

  await scrollTo(page, contact + 400);
  await capture(page, "sunrise");

  await page.evaluate(() => {
    for (const selector of ["#smooth-wrapper", ".site-header", "[data-act-rail]", ".cursor", ".grain"]) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) element.style.visibility = "hidden";
    }
  });
  await page.waitForTimeout(400);
  await capture(page, "scene-sunrise");

  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const reduced = await reducedContext.newPage();
  await reduced.goto(url);
  await waitForStory(reduced);
  await scrollTo(reduced, (await sectionTop(reduced, "orbit")) + 400);
  await capture(reduced, "reduced-motion");
  await reducedContext.close();

  const offContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const off = await offContext.newPage();
  await off.addInitScript(`
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (String(type).includes("webgl")) return null;
      return original.apply(this, [type, ...args]);
    };
  `);
  await off.goto(url);
  await waitForStory(off);
  await capture(off, "webgl-off");
  await offContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await mobileContext.newPage();
  await mobile.goto(url);
  await waitForStory(mobile);
  await capture(mobile, "mobile-hero");
  await mobileContext.close();

  await desktop.close();
  await createOgImage();
} finally {
  await browser.close();
  preview.kill("SIGTERM");
}
