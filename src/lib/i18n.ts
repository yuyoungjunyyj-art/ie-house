// To launch Japanese: add 'ja' here and provide src/content/ja/ with the same files as en/.
export const locales = ['en'] as const;
export const defaultLocale = 'en';
export type Locale = (typeof locales)[number];

const pageFiles = import.meta.glob('../content/*/*.json', { eager: true, import: 'default' });
const dataFiles = import.meta.glob('../content/*/data/*.json', { eager: true, import: 'default' });

export function content(locale: string): any {
  const pick = (files: Record<string, unknown>, base: string) =>
    Object.fromEntries(
      Object.entries(files)
        .filter(([path]) => path.startsWith(base))
        .map(([path, value]) => [path.slice(base.length).replace('.json', ''), value]),
    );
  return {
    ...pick(pageFiles, `../content/${locale}/`),
    data: pick(dataFiles, `../content/${locale}/data/`),
  };
}

export function localePaths() {
  return locales.map((locale) => ({
    params: { lang: locale === defaultLocale ? undefined : locale },
    props: { locale },
  }));
}

// Prefixes the locale and normalises the trailing slash, keeping any query or hash.
export function href(locale: string, path: string) {
  const [, pathname, suffix] = path.match(/^([^?#]*)(.*)$/) as RegExpMatchArray;
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  const full = `${prefix}${pathname}`.replace(/\/?$/, '/');
  return `${full}${suffix}`;
}
