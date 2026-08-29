import { test, expect } from '@playwright/test';
const BASE_URL = 'http://localhost:8124/';
const url = (path = '') => `${BASE_URL}${path}`;

test.describe('locale detection', () => {
  test.describe('zz', () => {
    test.use({ locale: 'zz' });
    test('falls back to base locale from unknown', async ({ page }) => {
      await page.goto(BASE_URL);

      expect(page.url()).toBe(BASE_URL);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'no hello',
      );
    });
  });

  test.describe('de', () => {
    test.use({ locale: 'de' });
    test('autodetects as navigator locale', async ({ page }) => {
      await page.goto(BASE_URL);

      expect(page.url()).toBe(url('de/'));
    });
  });

  test.describe('en', () => {
    test.use({ locale: 'en' });
    test('base locale', async ({ page }) => {
      await page.goto(BASE_URL);

      expect(page.url()).toBe(BASE_URL);
    });
  });

  test.describe('en-AU', () => {
    test.use({ locale: 'en-AU' });
    test('base locale', async ({ page }) => {
      await page.goto(BASE_URL);

      expect(page.url()).toBe(BASE_URL);
    });
  });

  test.describe('zh-cn', () => {
    test.use({ locale: 'zh-CN' });
    test('base locale', async ({ page }) => {
      await page.goto(BASE_URL);

      expect(page.url()).toBe(url('zh-cn/'));
    });
  });

  test.describe('zh', () => {
    test.use({ locale: 'zh' });
    test('base locale', async ({ page }) => {
      await page.goto(BASE_URL);

      expect(page.url()).toBe(BASE_URL);
    });
  });

  test('remembers override setting', async ({ page }) => {
    await page.goto(BASE_URL);
    expect(page.url()).toBe(BASE_URL);

    await page.locator('.language-picker summary').click();
    await page.getByRole('link', { name: 'Deutsch' }).click();
    await expect(page).toHaveURL(url('de/'));

    await page.goto(BASE_URL);
    expect(page.url()).toBe(url('de/'));
  });

  test('direct access ("/de") with other locale ("/fr") does not autodetect', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    expect(page.url()).toBe(BASE_URL);

    await page.locator('.language-picker summary').click();
    await page.getByRole('link', { name: 'Deutsch' }).click();
    await expect(page).toHaveURL(url('de/'));

    await page.goto(url('fr/'));
    expect(page.url()).toBe(url('fr/'));
  });
});
