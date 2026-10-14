import { unstable_cache } from 'next/cache';
import { createHash } from 'node:crypto';
import { connectDB } from './db.js';
import { Product, PageContent, FAQ, SiteSettings } from './models.js';
import { productSeeds, faqSeeds, pageSeeds, settingsSeed } from './seed-data.js';
const plain = value => JSON.parse(JSON.stringify(value));
// Isolate cache entries when the configured database changes between environments.
const scope = createHash('sha256').update(process.env.MONGODB_URI || 'public-review').digest('hex');
// Without a URI, public review uses documented initial catalog data. Writes always require MongoDB.
export const getProducts = unstable_cache(async () => {
  if (!process.env.MONGODB_URI) return productSeeds;
  await connectDB(); return plain(await Product.find({ status: 'published' }).sort({ order: 1 }).lean());
}, ['products', scope], { tags: ['catalog'], revalidate: 300 });
export const getFaqs = unstable_cache(async () => {
  if (!process.env.MONGODB_URI) return faqSeeds;
  await connectDB(); return plain(await FAQ.find({ status: 'published' }).sort({ order: 1 }).lean());
}, ['faqs', scope], { tags: ['content'], revalidate: 300 });
export const getPages = unstable_cache(async () => {
  if (!process.env.MONGODB_URI) return pageSeeds;
  await connectDB(); return plain(await PageContent.find({ status: 'published' }).lean());
}, ['pages', scope], { tags: ['content'], revalidate: 300 });
export const getSettings = unstable_cache(async () => {
  if (!process.env.MONGODB_URI) return { ...settingsSeed, email: process.env.BUSINESS_EMAIL || '', whatsappUrl: process.env.WHATSAPP_URL || settingsSeed.whatsappUrl };
  await connectDB(); return plain(await SiteSettings.findOne({ id: 'main' }).lean()) || settingsSeed;
}, ['settings', scope], { tags: ['settings'], revalidate: 300 });
export async function getProduct(locale, slug) { return (await getProducts()).find(p => p.content[locale].slug === slug); }
