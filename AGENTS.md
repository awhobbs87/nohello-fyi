# AGENTS.md

## Project overview

This repository builds the multilingual No Hello static site with Astro. It
uses PO translation catalogs, pnpm, TypeScript, Vitest, and Playwright.

## Runtime and package management

- Use Node.js 24 and pnpm 11.24.0.
- Use pnpm exclusively. Do not add npm or Yarn lockfiles.
- Do not edit `pnpm-lock.yaml` manually; update it through pnpm commands.

## Common commands

- `pnpm dev`: start Astro on port 8123.
- `pnpm format`: format Oxfmt-supported files and Astro files.
- `pnpm lint`: require clean formatting, zero Oxlint warnings/errors, and a
  clean Astro type check.
- `pnpm test:unit`: run Vitest.
- `pnpm test:ui`: build the site and run Playwright.
- `pnpm test:ui:update`: rebuild and intentionally update visual baselines.
- `pnpm build`: generate the static site in `build/`.

Run `pnpm lint`, `pnpm test:unit`, and the relevant browser tests before
committing. The pre-commit hook runs `pnpm lint` and must report zero problems.

## Source layout

- `src/pages/`: Astro routes, including localized static pages.
- `src/layouts/` and `src/components/`: shared Astro UI.
- `src/lib/`: translation and locale-selection logic.
- `src/css/styles.css`: global theme and responsive styles.
- `locales/<locale>/messages.po`: translation catalogs.
- `test/unit/`: Vitest tests.
- `test/ui/`: Playwright tests.

Do not edit generated files in `build/`, `.astro/`, `test-results/`, or
`playwright-report/`.

## Formatting and linting

- Oxfmt is the primary formatter for supported files.
- Astro is not supported by Oxfmt, so `.astro` files use Prettier with
  `prettier-plugin-astro`.
- Oxlint warnings are build failures. Do not raise the warning threshold or
  bypass rules without a documented, narrowly scoped reason.
- Astro Check remains authoritative for Astro and TypeScript diagnostics.

## Translation and UI conventions

- English is the source locale. Keep locale definitions in
  `src/_data/locales.json` and catalogs in `locales/` synchronized.
- Preserve translated copy unless the task explicitly changes it.
- Keep theme and office-mode preferences accessible, keyboard operable, and
  responsive. Mobile theme selection follows the system preference.
- Maintain WCAG AA contrast and a minimum 44px interactive target on mobile.
- Keep Phosphor installed as the preferred icon set. Inline the small number of
  icons used on the public page so the full icon webfont is not shipped.

## Git hygiene

- Preserve unrelated user changes in a dirty worktree.
- Do not commit generated build or test-report artifacts.
- Keep commits focused and use an imperative commit subject.
