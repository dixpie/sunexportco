import { getPages, getProducts } from '../lib/data.js';
import { url } from '../lib/seo.js';
export const dynamic = 'force-dynamic';
export default async function sitemap() { if (process.env.ALLOW_INDEXING !== 'true') return []; const [pages, products] = await Promise.all([getPages(), getProducts()]);
  const entries = pages.map(p => ({ en: `/en${p.id === 'home' ? '' : `/${p.id}`}`, ru: `/ru${p.id === 'home' ? '' : `/${p.id}`}`, modified: p.updatedAt }));
  entries.push(...products.map(p => ({ en: `/en/products/${p.content.en.slug}`, ru: `/ru/products/${p.content.ru.slug}`, modified: p.updatedAt })));
  return entries.flatMap(e => ['en', 'ru'].map(locale => ({ url: url(e[locale]), ...(e.modified ? { lastModified: new Date(e.modified) } : {}), alternates: { languages: { en: url(e.en), ru: url(e.ru), 'x-default': url(e.en) } } })));
}
