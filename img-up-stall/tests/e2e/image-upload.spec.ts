import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const fixturePath = (name: string) =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

test("selects an image and replaces the preview", async ({ page }) => {
  await page.goto("/");

  const input = page.getByLabel("Choose an image");
  const emptyState = page.getByText("No image selected.");

  await expect(emptyState).toBeVisible();
  await expect(page.getByRole("img")).toHaveCount(0);

  await input.setInputFiles(fixturePath("red.png"));

  const redPreview = page.getByRole("img", { name: "Preview of red.png" });
  await expect(redPreview).toBeVisible();
  await expect(page.getByText("Selected: red.png")).toBeVisible();
  await expect
    .poll(() => redPreview.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);

  await input.setInputFiles(fixturePath("blue.png"));

  await expect(
    page.getByRole("img", { name: "Preview of blue.png" }),
  ).toBeVisible();
  await expect(page.getByText("Selected: blue.png")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Preview of red.png" }),
  ).toHaveCount(0);
});

test("clears the selected image and preview", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("Choose an image");

  await input.setInputFiles(fixturePath("red.png"));
  await expect(
    page.getByRole("img", { name: "Preview of red.png" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Clear selection" }).click();

  await expect(page.getByText("No image selected.")).toBeVisible();
  await expect(page.getByRole("img")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Clear selection" }),
  ).toBeDisabled();
});

test("rejects an unsupported file with a useful message", async ({ page }) => {
  await page.goto("/");

  await page
    .getByLabel("Choose an image")
    .setInputFiles(fixturePath("notes.txt"));

  await expect(page.getByRole("alert")).toHaveText(
    "Unsupported file type. Choose a PNG, JPEG, or WebP image.",
  );
  await expect(page.getByRole("img")).toHaveCount(0);
  await expect(page.getByText("No image selected.")).toBeVisible();
});
