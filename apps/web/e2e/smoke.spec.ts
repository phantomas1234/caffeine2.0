import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Caffeine" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Caffeine" }).first(),
  ).toBeVisible();
});

test("navigation works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Projects" }).click();
  await expect(
    page.getByRole("heading", { name: "Projects" }),
  ).toBeVisible();
});

test("sign-in page renders", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(
    page.getByRole("button", { name: /continue with google/i }),
  ).toBeVisible();
});
