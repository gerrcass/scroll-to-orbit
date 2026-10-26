import { expect, test } from "@playwright/test";

test("the night pad loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/HALCYON/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The last quiet");
  await expect(page.locator("html")).toHaveAttribute("data-webgl", "true", { timeout: 12_000 });
  await expect(page.locator("#stage")).toBeVisible();
  await expect(page.locator("[data-countdown-long]")).toContainText(/\d+D/);
  expect(errors).toEqual([]);
});

test("the hero fits a phone without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
  await expect(page.getByRole("link", { name: /Reserve a launch window/i })).toBeVisible();
});
