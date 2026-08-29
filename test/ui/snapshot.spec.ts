import { test, expect } from '@playwright/test';
const BASE_URL = 'http://localhost:8124/';

test('updates the build-time year to the visitor current year', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2099-06-15T12:00:00Z') });
  await page.goto(`${BASE_URL}en/`);

  await expect(page.locator('[data-current-year]')).toHaveText([
    '2099',
    '2099',
  ]);
});

test('cycles and persists system, light, and dark themes', async ({ page }) => {
  await page.goto(`${BASE_URL}en/`);
  const toggle = page.getByRole('button', { name: /theme:/i });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  await expect(toggle).toContainText('System');
  await expect(toggle.locator('[data-theme-icon="system"]')).toBeVisible();

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toContainText('Light');
  await expect(toggle.locator('[data-theme-icon="light"]')).toBeVisible();

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toContainText('Dark');
  await expect(toggle.locator('[data-theme-icon="dark"]')).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toContainText('Dark');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
});

test('self-hosts Lato and uses a responsive content grid', async ({ page }) => {
  await page.goto(`${BASE_URL}en/`);
  await page.evaluate(() => document.fonts.ready);

  await expect(page.locator('body')).toHaveCSS('font-family', /^Lato,/);
  expect(await page.evaluate(() => document.fonts.check('400 16px Lato'))).toBe(
    true,
  );

  const fontOrigins = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /lato.*\.woff2?(?:\?|$)/i.test(name))
      .map((name) => new URL(name).origin),
  );
  expect(fontOrigins.length).toBeGreaterThan(0);
  expect(new Set(fontOrigins)).toEqual(new Set([new URL(BASE_URL).origin]));

  const section = page.locator('.container.nonos');
  await expect(section).toHaveCSS('display', 'grid');
  await expect(section).toHaveCSS(
    'grid-template-columns',
    /\d+(?:\.\d+)?px \d+(?:\.\d+)?px/,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(section).toHaveCSS('grid-template-columns', '358px');
});

test('publishes search result icon, preview, and description metadata', async ({
  page,
  request,
}) => {
  await page.goto(BASE_URL);

  const description =
    'A light-hearted guide to better chat etiquette: ask your question in the first message instead of sending only hello.';
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    description,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'index, follow, max-image-preview:large',
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    'content',
    '500',
  );
  await expect(
    page.locator('meta[property="og:image:height"]'),
  ).toHaveAttribute('content', '500');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );

  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('sizes', '180x180');
  const iconUrl = await icon.getAttribute('href');
  expect((await request.get(iconUrl!)).ok()).toBe(true);

  const structuredData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(structuredData).toMatchObject({
    '@type': 'WebPage',
    name: 'no hello',
    description,
    image: { width: 500, height: 500 },
  });
});

test('does not ship the Phosphor icon font for inline theme icons', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}en/`);

  const phosphorResources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /phosphor|regular\.woff/i.test(name)),
  );
  expect(phosphorResources).toEqual([]);
});

test('respects reduced motion for typing and the easter egg', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}en/`);

  await expect(page.locator('#strike')).toHaveText('hello');
  await expect(page.locator('.typed-cursor')).toHaveCount(0);
  await page.keyboard.type('hello');
  await expect(page.locator('body')).toHaveCSS('background-image', 'none');

  await context.close();
});

test('dark theme color tokens meet WCAG AA contrast', async ({ page }) => {
  await page.goto(`${BASE_URL}en/`);
  const toggle = page.getByRole('button', { name: /theme:/i });
  await toggle.click();
  await toggle.click();

  const ratios = await page.locator('html').evaluate((html) => {
    const styles = getComputedStyle(html);
    const color = (name: string) => styles.getPropertyValue(`--${name}`).trim();
    // oxlint-disable-next-line unicorn/consistent-function-scoping -- Playwright serializes this function with its closure.
    const luminance = (hex: string) => {
      const channels = hex
        .match(/[a-f\d]{2}/gi)!
        .map((channel) => Number.parseInt(channel, 16) / 255)
        .map((channel) =>
          channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4,
        );
      return (
        0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
      );
    };
    const contrast = (foreground: string, background: string) => {
      const foregroundLuminance = luminance(color(foreground));
      const backgroundLuminance = luminance(color(background));
      return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      );
    };

    return {
      body: contrast('body-text', 'page-background'),
      mutedCard: contrast('muted-text', 'card-background'),
      link: contrast('link', 'page-background'),
      danger: contrast('danger', 'page-background'),
      success: contrast('success', 'page-background'),
    };
  });

  for (const ratio of Object.values(ratios)) expect(ratio).toBeGreaterThan(4.5);
});

test('uses system theme and a labelled office control on mobile', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}en/`);
  const themeToggle = page.getByRole('button', { name: /theme:/i });
  await themeToggle.click();
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  const officeToggle = page.getByRole('button', { name: /the office/i });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  await expect(themeToggle).toBeHidden();
  await expect(officeToggle).toBeVisible();
  await expect(officeToggle.locator('[data-office-label]')).toBeVisible();
  await expect(officeToggle).toContainText('The Office UK');
  expect((await officeToggle.boundingBox())!.width).toBeGreaterThan(120);
  await expect(page.locator('.preference-controls')).toHaveCSS(
    'position',
    'static',
  );
  await expect(page.locator('.preference-controls')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );

  await officeToggle.click();
  await expect(officeToggle).toContainText('🇺🇸The Office US');

  await expect(page.locator('.slack').first()).toHaveCSS('display', 'grid');
  const avatarBox = await page
    .locator('.slack img:visible')
    .first()
    .boundingBox();
  const contentBox = await page.locator('.slack-content').first().boundingBox();
  expect(contentBox!.x).toBeGreaterThanOrEqual(avatarBox!.x + avatarBox!.width);
});

test('changes locale from the footer language menu', async ({ page }) => {
  await page.goto(`${BASE_URL}en/`);
  const languagePicker = page.locator('.language-picker');
  const languageTrigger = languagePicker.locator('summary');

  await expect(languageTrigger).toContainText('English');
  await expect(languageTrigger).toContainText('🇬🇧');
  const restingTriggerBackground = await languageTrigger.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await languageTrigger.hover();
  await expect(languageTrigger).not.toHaveCSS(
    'background-color',
    restingTriggerBackground,
  );
  await languageTrigger.click();
  await expect(languagePicker).toHaveAttribute('open', '');
  await expect(languagePicker.locator('nav')).toHaveCSS('bottom', '52px');
  const frenchOption = page.getByRole('link', { name: 'Français' });
  await expect(frenchOption).toContainText('🇫🇷');

  const restingBackground = await frenchOption.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const restingBorder = await frenchOption.evaluate(
    (element) => getComputedStyle(element).borderTopColor,
  );
  await frenchOption.hover();
  await expect(frenchOption).not.toHaveCSS(
    'background-color',
    restingBackground,
  );
  await expect(frenchOption).not.toHaveCSS('border-top-color', restingBorder);

  await frenchOption.click();
  await expect(page).toHaveURL(`${BASE_URL}fr/`);
  await expect(page.locator('.language-picker summary')).toContainText(
    'Français',
  );
});

test('switches and persists UK and US office characters', async ({ page }) => {
  await page.goto(`${BASE_URL}en/`);
  const toggle = page.getByRole('button', { name: /the office/i });

  await expect(page.locator('html')).toHaveAttribute('data-office', 'uk');
  await expect(toggle).toContainText('🇬🇧The Office UK');
  await expect(page.getByText('Keith', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Kevin', { exact: true }).first()).toBeHidden();

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-office', 'us');
  await expect(toggle).toContainText('🇺🇸The Office US');
  await expect(page.getByText('Kevin', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Keith', { exact: true }).first()).toBeHidden();
  await expect(page.getByAltText("Kevin's chat avatar").first()).toBeVisible();
  await expect(
    page.getByText(/Kevin could have got his answer minutes sooner/),
  ).toBeVisible();
  await expect(page.getByText(/I wrote it down somewhere/)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "❌ Don't try this" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Michael's meeting is\? I lost my sticky note/),
  ).toBeVisible();
  await expect(
    page.getByText(/forward the invite so you can pretend you're working/),
  ).toBeVisible();
  await expect(page.getByText('Yes please!', { exact: true })).toBeVisible();
  await expect(page.getByText(/Urgent Paper Audit/)).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-office', 'us');
  await expect(toggle).toContainText('The Office US');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-office', 'uk');
});

test('frames the guidance as a light-hearted nudge', async ({ page }) => {
  await page.goto(`${BASE_URL}en/`);

  await expect(
    page.getByText(/light-hearted nudge, not a rulebook/),
  ).toBeVisible();
  await expect(page.getByText(/assume good intent, be kind/)).toBeVisible();
});

test('uses a compact, structured footer across viewports', async ({ page }) => {
  await page.goto(`${BASE_URL}en/`);

  const footer = page.locator('footer');
  const footerBottom = page.locator('.footer-bottom');
  await expect(footer).toHaveCSS('padding-top', '48px');
  await expect(page.locator('.footer-note')).toHaveCSS('font-size', '20px');
  await expect(footerBottom).toHaveCSS('display', 'grid');
  await expect(footerBottom).toHaveCSS(
    'grid-template-columns',
    /\d+(?:\.\d+)?px 240px/,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(footer).toHaveCSS('padding-top', '40px');
  await expect(page.locator('.footer-note')).toHaveCSS('font-size', '18px');
  await expect(footerBottom).toHaveCSS('grid-template-columns', '358px');
});

test('serves a localized custom 404 page', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de' });
  const page = await context.newPage();
  const response = await page.goto(`${BASE_URL}missing-conversation/`);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Seite nicht gefunden',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(page.getByRole('link', { name: /no hello/i })).toHaveAttribute(
    'href',
    '/de/',
  );

  await context.close();
});

test('publishes a sitemap without the error page', async ({ request }) => {
  const index = await request.get(`${BASE_URL}sitemap-index.xml`);
  expect(index.ok()).toBe(true);

  const sitemap = await request.get(`${BASE_URL}sitemap-0.xml`);
  const body = await sitemap.text();
  expect(body).toContain('<loc>https://nohello.net/</loc>');
  expect(body).toContain('<loc>https://nohello.net/de/</loc>');
  expect(body).not.toContain('/404/');
});

test.describe('index snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);

    // pause cursor blinking, otherwise snapshots can differ :(
    await page.$eval('.typed-cursor', (el) =>
      el.classList.remove('typed-cursor--blink'),
    );
  });

  test('renders the core page layout', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('no');
    await expect(page.locator('.nonos .list-card.example')).toBeVisible();
    await expect(page.locator('.yepyep .list-card.example')).toBeVisible();
    await expect(page.locator('.preference-controls')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('why', async ({ page }) => {
    await page
      .locator('#preloadimg')
      .evaluate((image: HTMLImageElement) => image.decode());
    await page.keyboard.type('hello');

    await expect(page.locator('body')).toHaveCSS(
      'background-image',
      /why.*\.gif/,
    );
    await expect(page.locator('.subtitle')).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
  });
});
