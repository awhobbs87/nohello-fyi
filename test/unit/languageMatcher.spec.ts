import { describe, expect, it } from 'vitest';
import locales from '../../src/_data/locales.json';
import { languageMatcher } from '../../src/lib/languageMatcher';

const languages = locales.map(({ path }) => path);
const fallback = languages[0] ?? 'en';

describe('languageMatcher', () => {
  it.each([
    [undefined, undefined, '/en'],
    [undefined, 'zz', '/en'],
    [undefined, 'de', '/de'],
    [undefined, 'en-AU', '/en'],
    [undefined, 'zh', '/en'],
    [undefined, 'zh-CN', '/zh-cn'],
    [undefined, 'pt-BR', '/pt-br'],
    [undefined, 'pt_BR', '/pt-br'],
  ])(
    'matches preferred=%s browser=%s to %s',
    (preferred, browserLocale, expected) => {
      expect(
        languageMatcher(languages, fallback, preferred, browserLocale),
      ).toBe(expected);
    },
  );

  it.each([
    [null, '/en'],
    ['zz', '/en'],
    ['en', '/en'],
    ['de', '/de'],
    ['pt-br', '/pt-br'],
  ])('uses saved preference %s', (preferred, expected) => {
    expect(languageMatcher(languages, fallback, preferred)).toBe(expected);
  });
});
