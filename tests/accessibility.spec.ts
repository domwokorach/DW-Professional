import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/accessibility"]) {
  test(`${path} has no automated accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Accept" }).click();
    await expect(page.getByRole("region", { name: "Cookie preferences" })).toHaveCount(0);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

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
