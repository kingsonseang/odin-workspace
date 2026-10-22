import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const updatedFixturePath = fileURLToPath(
  new URL('../../src/fixtures/updated-document.json', import.meta.url),
);

test('downloads the updated nested document as a parseable JSON file', async ({ page }, testInfo) => {
  // Vite keeps a live connection open in Firefox, so wait for the committed
  // navigation and then use web-first assertions for the rendered UI.
  await page.goto('/', { waitUntil: 'commit' });

  await expect(page.getByRole('heading', { name: 'JSON Viewer' })).toBeVisible();
  await expect(page.getByText('Revision 1')).toBeVisible();

  await page.getByRole('button', { name: 'Load updated JSON' }).click();
  await expect(page.getByText('Revision 2')).toBeVisible();
  await expect(page.getByText('"Updated immediately before export"')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('json-viewer-export.json');

  const downloadPath = testInfo.outputPath('json-viewer-export.json');
  await download.saveAs(downloadPath);

  const downloadedText = await readFile(downloadPath, 'utf8');
  const expectedText = await readFile(updatedFixturePath, 'utf8');
  const exported = JSON.parse(downloadedText) as unknown;
  const expected = JSON.parse(expectedText) as unknown;

  expect(exported).toEqual(expected);
  expect(exported).toMatchObject({
    workspace: {
      revision: 2,
      emptyList: [],
      emptyObject: {},
      activity: [
        {},
        {},
        {
          id: 3,
          type: 'exported',
          payload: {
            source: 'in-app-update',
            note: '',
            artifacts: [],
          },
        },
      ],
    },
  });
});
