import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/accessibility", "/page-that-does-not-exist"]) {
  test(`${path} has no automated accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Accept" }).click();
    await expect(page.getByRole("region", { name: "Cookie preferences" })).toHaveCount(0);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

test("404 routes show page-not-found actions", async ({ page }) => {
  await page.goto("/page-that-does-not-exist");

  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go Home" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go Back" })).toBeVisible();
});

test("offline events show the connection-lost state", async ({ page }) => {
  await page.goto("/");
  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));

  await expect(page.getByRole("heading", { name: "Connection lost" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go Home" })).toBeVisible();

  await page.context().setOffline(false);
});

test("accessibility display preferences apply and persist", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByRole("region", { name: "Cookie preferences" })).toHaveCount(0);

  const controlsButton = page.getByRole("button", { name: "Accessibility options" });
  await controlsButton.focus();
  await expect(controlsButton).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /High contrast/ }).click();
  await page.getByRole("button", { name: "Increase text size" }).click();
  await page.getByRole("button", { name: /Bold text/ }).click();

  await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await expect(page.locator("html")).toHaveAttribute("data-bold-text", "true");

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await expect(page.locator("html")).toHaveAttribute("data-bold-text", "true");

  await page.getByRole("button", { name: "Accessibility options" }).click();
  await page.getByRole("button", { name: "Reset accessibility settings" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "false");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "default");
  await expect(page.locator("html")).toHaveAttribute("data-bold-text", "false");
});

test("appearance preference applies and follows the selected theme", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByRole("region", { name: "Cookie preferences" })).toHaveCount(0);

  const themeButton = page.getByRole("button", { name: /Theme/ });
  await themeButton.click();
  await expect(page.getByRole("menuitemradio", { name: /System/ })).toHaveAttribute(
    "aria-checked",
    "true"
  );

  const darkButton = page.getByRole("menuitemradio", { name: /Dark/ });
  await darkButton.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await themeButton.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: /Light/ })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitemradio", { name: /System/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(themeButton).toBeFocused();

  await themeButton.click();
  await page.getByRole("menuitemradio", { name: /Light/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.emulateMedia({ colorScheme: "dark" });
  await themeButton.click();
  await page.getByRole("menuitemradio", { name: /System/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("language selection preserves the route and persists the locale", async ({ page }) => {
  await page.route("**/api/translations", async (route) => {
    const request = route.request().postDataJSON() as { texts: string[] };
    await route.fulfill({ json: { translations: request.texts } });
  });
  await page.goto("/en-gb/accessibility");

  const languageButton = page.getByRole("button", { name: /Language: English \(UK\)/ });
  await languageButton.click();
  await page.getByRole("menuitemradio", { name: "Français" }).click();

  await expect(page).toHaveURL(/\/fr\/accessibility$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("button", { name: /Français/ })).toBeVisible();
  expect((await page.context().cookies()).find((cookie) => cookie.name === "portfolio-locale")?.value).toBe("fr");
});

test("Arabic routes render with RTL direction and the selector works on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("button", { name: /العربية/ })).toBeVisible();
});
