import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

function fixturePath(name: string): string {
  return resolve(process.cwd(), 'tests/fixtures', name);
}

test('selecting, replacing, and clearing an image keeps the preview in sync', async ({
  page,
}) => {
  await page.goto('/');

  const input = page.getByLabel('Choose an image');
  const preview = page.getByRole('img');

  await expect(preview).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Clear selection' }),
  ).toHaveCount(0);

  await input.setInputFiles(fixturePath('red.png'));

  await expect(preview).toHaveCount(1);
  await expect(preview).toHaveAttribute('alt', /red\.png/i);
  await expect(preview).toHaveAttribute('src', /^blob:/);
  await expect(preview).toHaveJSProperty('naturalWidth', 32);
  await expect(page.getByText(/selected file:/i)).toContainText('red.png');

  const firstSrc = await preview.getAttribute('src');

  await input.setInputFiles(fixturePath('blue.png'));

  await expect(preview).toHaveCount(1);
  await expect(preview).toHaveAttribute('alt', /blue\.png/i);
  await expect(preview).toHaveAttribute('src', /^blob:/);
  await expect(preview).toHaveJSProperty('naturalWidth', 32);
  await expect(page.getByText(/selected file:/i)).toContainText('blue.png');

  const secondSrc = await preview.getAttribute('src');
  expect(secondSrc).not.toBe(firstSrc);

  await page.getByRole('button', { name: 'Clear selection' }).click();

  await expect(preview).toHaveCount(0);
});

test('rejects an unsupported file with a useful message', async ({ page }) => {
  await page.goto('/');

  const input = page.getByLabel('Choose an image');

  await input.setInputFiles(fixturePath('notes.txt'));

  await expect(page.getByRole('alert')).toContainText(
    'Choose a PNG, JPEG, or WebP image.',
  );
  await expect(page.getByRole('img')).toHaveCount(0);
});
