import { expect, test } from "@playwright/test";

test("walks through a focus session", async ({ page }) => {
  const stamp = Date.now();
  const category = `School ${stamp}`;
  const task = `Read chapter ${stamp}`;

  await page.goto("/focus");
  const start = page.getByRole("button", { name: "Start" });
  const cancel = page.getByRole("button", { name: "Cancel" });
  await expect(start.or(cancel)).toBeVisible();
  if (await cancel.isVisible()) {
    await cancel.click();
    await expect(start).toBeVisible();
  }

  await page.goto("/tasks");
  await page.getByPlaceholder("School").fill(category);
  await page
    .locator("form")
    .filter({ has: page.getByPlaceholder("School") })
    .getByRole("button", { name: "Add" })
    .click();
  await expect(page.getByRole("listitem").filter({ hasText: category })).toBeVisible();

  await page.getByPlaceholder("Finish CS234 assignment").fill(task);
  await expect(page.locator("select option", { hasText: category })).toHaveCount(1);
  await page.locator("select").selectOption({ label: category });
  await page
    .locator("form")
    .filter({ has: page.getByPlaceholder("Finish CS234 assignment") })
    .getByRole("button", { name: "Add" })
    .click();

  const row = page.getByRole("listitem").filter({ hasText: task });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: "Focus" }).click();

  await expect(page.getByRole("heading", { name: "Focus" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start" })).toBeEnabled();
  await page.locator("select").nth(1).selectOption("custom");
  await page.getByLabel("Focus minutes").fill("1");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.getByRole("heading", { name: task })).toBeVisible();
  await expect(page.getByText(/01:00|00:59/)).toBeVisible();

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByText("Paused", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
});
