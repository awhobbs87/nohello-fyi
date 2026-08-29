import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import locales from '../../src/_data/locales.json';
import {
  loadTranslations,
  REQUIRED_TRANSLATION_KEYS,
} from '../../src/lib/i18n';

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
});
