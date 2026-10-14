import { t } from './copy.js';
export const origin = () => new URL(process.env.SITE_ORIGIN || 'http://localhost:3000').origin;
export const url = path => `${origin()}${path}`;
export function metadata(locale, path, title, description, alternatives) {
  const fullPath = `/${locale}${path}`;
  return {
    title, description, metadataBase: new URL(origin()),
    alternates: { canonical: url(fullPath), languages: { en: url(alternatives?.en || `/en${path}`), ru: url(alternatives?.ru || `/ru${path}`), 'x-default': url(alternatives?.en || `/en${path}`) } },
    openGraph: { type: 'website', siteName: 'SunExportCo', title, description, url: url(fullPath), locale: locale === 'ru' ? 'ru_RU' : 'en_US', alternateLocale: locale === 'ru' ? 'en_US' : 'ru_RU', images: [{ url: url('/media/hero-fruit.webp'), width: 892, height: 941, alt: t(locale).hero }] },
    twitter: { card: 'summary_large_image', title, description, images: [url('/media/hero-fruit.webp')] },
    robots: process.env.ALLOW_INDEXING === 'true' ? { index: true, follow: true } : { index: false, follow: false },
  };
}
export function breadcrumbSchema(items) { return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(path) })) }; }
export function JsonLd({ value }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, '\\u003c') }} />; }
