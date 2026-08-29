/** Choose a localized route from a saved preference or browser locale. */
export function languageMatcher(
  languages: string[],
  fallback: string,
  preferred?: string | null,
  browserLocale?: string,
): string {
  if (preferred != null && languages.includes(preferred)) {
    return `/${preferred}`;
  }

  if (browserLocale != null) {
    const normalized = browserLocale.toLowerCase().replace(/[-_]/, '-');

    if (languages.includes(normalized)) {
      return `/${normalized}`;
    }

    const language = normalized.split('-')[0];
    if (language != null && languages.includes(language)) {
      return `/${language}`;
    }
  }

  return `/${fallback}`;
}
