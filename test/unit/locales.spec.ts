import fs from 'node:fs';
import * as gettextParser from 'gettext-parser';
import { describe, expect, it } from 'vitest';
import locales from '../../src/_data/locales.json';
import {
  loadTranslations,
  REQUIRED_TRANSLATION_KEYS,
} from '../../src/lib/i18n';

const readMessages = (locale: string) => {
  const source = fs.readFileSync(`locales/${locale}/messages.po`);
  return gettextParser.po.parse(source).translations[''] ?? {};
};

describe('locales', () => {
  it('uses English as the fallback locale', () => {
    expect(locales[0]).toEqual({
      path: 'en',
      name: 'English',
      flag: '🇬🇧',
    });
  });

  it('provides a flag for every locale', () => {
    for (const locale of locales) {
      expect(locale.flag).toMatch(/^\p{Regional_Indicator}{2}$/u);
    }
  });

  it.each(locales)('$name has a complete PO catalog', ({ path }) => {
    expect(fs.existsSync(`locales/${path}/messages.po`)).toBe(true);

    const { t } = loadTranslations(path);
    for (const key of REQUIRED_TRANSLATION_KEYS) {
      expect(t(key)).not.toBe(key);
      expect(t(key).length).toBeGreaterThan(0);
    }
  });

  it('interpolates positional values', () => {
    const { t } = loadTranslations('en');
    expect(t('example.bad.body', 2099)).toContain('2099');
  });

  it('keeps positional placeholders compatible with English', () => {
    const sourceMessages = readMessages('en');

    for (const locale of locales) {
      const messages = readMessages(locale.path);
      for (const key of REQUIRED_TRANSLATION_KEYS) {
        const sourcePlaceholders = [
          ...(sourceMessages[key]?.msgstr[0]?.matchAll(/%\d+\$s/g) ?? []),
        ].map(([placeholder]) => placeholder);
        const translatedPlaceholders = [
          ...(messages[key]?.msgstr[0]?.matchAll(/%\d+\$s/g) ?? []),
        ].map(([placeholder]) => placeholder);

        expect(
          translatedPlaceholders.toSorted(),
          `${locale.path}: ${key}`,
        ).toEqual(sourcePlaceholders.toSorted());
      }
    }
  });

  it('does not hardcode the old year in translated page copy', () => {
    for (const locale of locales) {
      const messages = readMessages(locale.path);
      for (const key of REQUIRED_TRANSLATION_KEYS) {
        expect(
          messages[key]?.msgstr[0],
          `${locale.path}: ${key}`,
        ).not.toContain('2022');
      }
    }
  });
});
