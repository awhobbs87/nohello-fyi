import fs from 'node:fs';
import path from 'node:path';
import * as gettextParser from 'gettext-parser';
import { marked } from 'marked';

export const REQUIRED_TRANSLATION_KEYS = [
  'header.subtitle',
  'header.introduction',
  'example.character.neutral.name',
  'example.character.neutral.avatar-description',
  'example.character.bad.name',
  'example.character.bad.avatar-description',
  'example.character.good.name',
  'example.character.good.avatar-description',
  'example.bad.title',
  'example.bad.body',
  'example.bad.message1.timestamp',
  'example.bad.message1.body',
  'example.bad.reply1.timestamp',
  'example.bad.reply1.body',
  'example.bad.message2.timestamp',
  'example.bad.message2.body',
  'example.bad.reply2.timestamp',
  'example.bad.reply2.body',
  'example.good.title',
  'example.good.body',
  'example.good.message1.timestamp',
  'example.good.message1.body',
  'example.good.reply1.timestamp',
  'example.good.reply1.body',
  'example.good.message2.timestamp',
  'example.good.message2.body',
  'example.good.reply2.timestamp',
  'example.good.reply2.body',
  'footer.note',
  'footer.warning',
  'footer.thanks',
  'footer.languages',
] as const;

export type TranslationKey = (typeof REQUIRED_TRANSLATION_KEYS)[number];
type TranslationMap = Record<TranslationKey, string>;

const cache = new Map<string, TranslationMap>();

function interpolate(value: string, args: Array<string | number>): string {
  return value.replace(/%(\d+)\$s/g, (_, position: string) => {
    return String(args[Number(position) - 1] ?? '');
  });
}

export function loadTranslations(locale: string) {
  let translations = cache.get(locale);

  if (translations == null) {
    const filename = path.join(process.cwd(), 'locales', locale, 'messages.po');
    const catalog = gettextParser.po.parse(fs.readFileSync(filename));
    const entries = catalog.translations[''] ?? {};

    translations = Object.fromEntries(
      REQUIRED_TRANSLATION_KEYS.map((key) => {
        const value = entries[key]?.msgstr[0];
        if (value == null || value === '') {
          throw new Error(`Missing translation "${key}" in ${filename}`);
        }
        return [key, value];
      }),
    ) as TranslationMap;

    cache.set(locale, translations);
  }

  const t = (key: TranslationKey, ...args: Array<string | number>) =>
    interpolate(translations[key], args);

  return {
    t,
    markdown: (key: TranslationKey, ...args: Array<string | number>) =>
      marked.parseInline(t(key, ...args)),
    markdownBlock: (key: TranslationKey, ...args: Array<string | number>) =>
      marked.parse(t(key, ...args)),
  };
}
