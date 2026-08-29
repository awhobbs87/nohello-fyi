# No Hello

Please don't say just hello in chat: <https://nohello.net/>.

This fork is an [Astro](https://astro.build/) static site with PO-based
translations, Oxlint and Oxfmt checks, Vitest unit tests, and Playwright browser
tests.

## Requirements

- Node.js 24
- pnpm 11.24.0 (declared in `package.json`)

With Corepack available, run `corepack enable` once. Otherwise install pnpm
using its official installation instructions.

## Development

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The site is served at <http://localhost:8123/>.

## Checks

```sh
pnpm build
pnpm format
pnpm lint
pnpm test:unit
pnpm exec playwright install chromium # first browser-test run only
pnpm test:ui
```

`pnpm install` configures the repository's pre-commit hook. The hook runs
`pnpm lint`, which rejects formatting differences and any Oxlint warning,
Oxlint error, or Astro diagnostic.

Oxfmt formats supported JavaScript ecosystem files. Astro files continue to
use Prettier with `prettier-plugin-astro` because Oxfmt does not yet support the
Astro file format.

## Translations

English is the source locale. Translation catalogs live in
`locales/<locale>/messages.po`, while the available languages are declared in
`src/_data/locales.json`.

The project historically used Transifex. Before restoring automated
synchronization, configure a Transifex resource for this fork and document its
authentication in the deployment environment.
