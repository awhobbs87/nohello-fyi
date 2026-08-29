import { expect, test, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8124/';

async function preparePage(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript((savedTheme) => {
    localStorage.setItem('theme', savedTheme);
    localStorage.setItem('office', 'uk');
  }, theme);
  await page.goto(`${BASE_URL}en/`);
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ['light', 'dark'] as const) {
  test(`desktop ${theme} layout`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await preparePage(page, theme);

    await expect(page).toHaveScreenshot(`desktop-${theme}.png`, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test(`mobile ${theme} layout`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await preparePage(page, theme);

    await expect(page).toHaveScreenshot(`mobile-${theme}.png`, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
}
