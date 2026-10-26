import { expect, test, type Page } from "@playwright/test";

const offsets = async (page: Page): Promise<Record<string, number>> =>
  page.evaluate(() =>
    Object.fromEntries(
      ["vehicle", "mission", "ascent", "separation", "orbit", "manifest", "contact"].map((id) => [
        id,
        Math.round(
          (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY,
        ),
      ]),
    ),
  );

const scrollTo = async (page: Page, top: number): Promise<void> => {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
};

test("the story advances through the countdown and ascent", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-webgl", "true", { timeout: 12_000 });

  const positions = await offsets(page);
  await scrollTo(page, positions.mission ?? 0);
  await expect(page.locator('[data-act-link="IGNITION"]')).toHaveClass(/is-active/);
  await expect(page.locator("[data-clock-s]")).toHaveText("10");

  await scrollTo(page, (positions.mission ?? 0) + 760);
  await page.waitForFunction(
    () => Number(document.querySelector("[data-clock-s]")?.textContent ?? 10) < 10,
  );
  await expect(page.locator("[data-launch-status]")).toContainText(/IGNITION|GO FOR LAUNCH/);

  await scrollTo(page, (positions.ascent ?? 0) + 450);
  await expect(page.locator('[data-act-link="ASCENT"]')).toHaveClass(/is-active/);
  await page.waitForFunction(
    () => Number(document.querySelector('[data-telemetry="altitude"]')?.textContent ?? 0) > 0,
  );
  const altitude = await page.locator('[data-telemetry="altitude"]').first().textContent();
  expect(Number(altitude)).toBeGreaterThan(0);

  await scrollTo(page, positions.separation ?? 0);
  await expect(page.locator('[data-act-link="SEPARATION"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-telemetry="velocity"]').first()).not.toHaveText("0.00");

  await scrollTo(page, (positions.separation ?? 0) + 900);
  await expect(page.locator('[data-telemetry="stage"]').first()).toHaveText("02");

  await scrollTo(page, positions.orbit ?? 0);
  await expect(page.locator('[data-act-link="ORBIT"]')).toHaveClass(/is-active/);

  expect(errors).toEqual([]);
});

test("primary navigation uses the smooth scroll path", async ({ page }) => {
  await page.goto("/");
  const missionLink = page.locator('.primary-nav a[href="#mission"]');
  await missionLink.click();
  await page.waitForFunction(() => {
    const mission = document.getElementById("mission");
    if (!mission) return false;
    return Math.abs(mission.getBoundingClientRect().top) < 4;
  });
  await expect(page.locator('[data-act-link="IGNITION"]')).toHaveClass(/is-active/);
});

test("the mobile menu closes on Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator("[data-menu-toggle]");
  const menu = page.locator("[data-mobile-menu]");
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(menu).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
});

test("reduced motion skips smoothing but keeps the countdown", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  const wrapperTransform = await page.evaluate(
    () => getComputedStyle(document.querySelector("#smooth-wrapper") as Element).transform,
  );
  expect(wrapperTransform === "none" || wrapperTransform === "").toBe(true);

  const positions = await offsets(page);
  await scrollTo(page, (positions.mission ?? 0) + 900);
  await page.waitForFunction(
    () => Number(document.querySelector("[data-clock-s]")?.textContent ?? 10) < 10,
  );
  await expect(page.locator("[data-launch-status]")).toContainText(/IGNITION|LAUNCH|LIFTOFF/);
});


test("the vehicle schematic morphs into the recovery profile", async ({ page }) => {
  await page.goto("/");
  const positions = await offsets(page);
  await scrollTo(page, positions.vehicle ?? 0);
  await expect(page.locator("[data-config-label]")).toHaveText("ASCENT CONFIGURATION");
  const before = await page.locator("[data-flight-profile]").getAttribute("d");

  await scrollTo(page, (positions.vehicle ?? 0) + 430);
  await expect(page.locator("[data-config-label]")).toHaveText("RECOVERY CONFIGURATION");
  await expect(page.locator("[data-profile-state]")).toHaveText("RECOVERY / RETURN");
  const after = await page.locator("[data-flight-profile]").getAttribute("d");
  expect(after).not.toBe(before);
});


test("the orbit dial is keyboard operable and rewrites the map", async ({ page }) => {
  await page.goto("/");
  const positions = await offsets(page);
  await scrollTo(page, (positions.orbit ?? 0) + 400);

  const knob = page.locator("[data-dial-knob]");
  await expect(knob).toHaveAttribute("aria-valuenow", "1");
  await expect(knob).toBeVisible();
  await knob.focus();
  await expect(knob).toBeFocused();

  const satelliteBefore = await page.locator("[data-orbit-sat]").getAttribute("transform");
  await page.waitForTimeout(900);
  const satelliteAfter = await page.locator("[data-orbit-sat]").getAttribute("transform");
  expect(satelliteAfter).not.toBe(satelliteBefore);

  await page.keyboard.press("ArrowRight");
  await expect(knob).toHaveAttribute("aria-valuenow", "2");
  await expect(page.locator('[data-dial="name"]')).toHaveText("GTO");
  await expect(page.locator('[data-dial="altitude"]')).toHaveText("35,786");
  await expect(page.locator('[data-orbit-path="GTO"]')).toHaveAttribute("stroke", "#ff5a1f");

  await page.keyboard.press("Home");
  await expect(knob).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator('[data-dial="name"]')).toHaveText("LEO");
  await expect(page.locator('[data-dial="altitude"]')).toHaveText("550");
});


test("the manifest lists three missions and the brief form completes", async ({ page }) => {
  await page.goto("/");
  const positions = await offsets(page);

  await scrollTo(page, positions.manifest ?? 0);
  await expect(page.locator(".mission-row")).toHaveCount(3);
  await expect(page.locator(".mission-row").first()).toContainText("VESPER-01");

  await scrollTo(page, positions.contact ?? 0);
  const form = page.locator("[data-contact-form]");
  const button = form.locator('button[type="submit"]');
  await expect(form).toBeVisible();
  await form.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator("#email").fill("ops@example.com");
  await button.click();

  await expect(form).toHaveClass(/is-sent/, { timeout: 10_000 });
  await expect(page.locator("[data-form-status]")).toContainText("Intent logged");
  await expect(button).toBeDisabled();
  await expect(page).toHaveURL(/\/$/);
});

test("the brief keeps a mailto fallback without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The last quiet");
  await expect(page.locator("[data-contact-form]")).toHaveAttribute("action", /mailto:/);
  await expect(page.locator("[data-contact-form]")).toContainText("missions@halcyon.space");
  await context.close();
});
