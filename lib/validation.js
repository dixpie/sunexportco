import { z } from 'zod';
const text = (max) => z.string().trim().max(max);
const localized = (schema) => z.object({ en: schema, ru: schema }).strict();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
export const inquirySchema = z.object({
  fullName: text(120).min(2), company: text(160).default(''), country: text(80).default(''),
  email: z.union([z.email().max(254), z.literal('')]).default(''), phone: text(40).refine(v => !v || (/^\+?[\d\s().-]{7,40}$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15)),
  productId: z.union([slug, z.literal('')]), quantity: z.union([z.number().positive().max(1000000), z.null()]), unit: z.enum(['tonnes', 'kg', 'cartons', 'containers']),
  destination: text(200).default(''), message: text(3000).default(''), locale: z.enum(['en', 'ru']),
  sourcePage: z.string().max(240).regex(/^\/(en|ru)(\/[^?#\s]*)?$/), consent: z.literal(true),
  requestId: z.uuid(), website: z.literal('').default(''),
}).strict().refine(v => v.email || v.phone, { path: ['email'], message: 'contact_required' });
const safeMedia = z.string().regex(/^\/(media\/[a-zA-Z0-9._-]+|api\/media\/[a-f0-9]{24})$/).max(200);
const productContent = z.object({ slug, name: text(150).min(1), description: text(1800).min(1), seoTitle: text(180), seoDescription: text(400) }).strict();
export const productSchema = z.object({
  id: slug, order: z.number().int().min(0).max(1000), status: z.enum(['draft', 'published']), content: localized(productContent),
  availability: localized(text(250)), images: z.array(z.object({ src: safeMedia, alt: localized(text(250).min(1)) }).strict()).min(1).max(12),
  specs: z.array(z.object({ key: slug, label: localized(text(100).min(1)), value: localized(text(300).min(1)) }).strict()).max(20),
}).strict();
export const faqSchema = z.object({ id: slug, order: z.number().int().min(0).max(1000), status: z.enum(['draft', 'published']), content: localized(z.object({ question: text(300).min(1), answer: text(2000).min(1) }).strict()) }).strict();
export const pageSchema = z.object({ id: z.enum(['home', 'products', 'about', 'export-packaging', 'faq', 'contact', 'request-quote', 'privacy']), status: z.enum(['draft', 'published']), content: localized(z.object({ title: text(180), description: text(600), sections: z.array(z.object({ heading: text(180).min(1), body: text(4000).min(1) }).strict()).max(20) }).strict()) }).strict();
export const settingsSchema = z.object({ id: z.literal('main'), phone: z.string().regex(/^\+\d{7,15}$/), phoneDisplay: text(40).min(1), email: z.union([z.email(), z.literal('')]), address: localized(text(500)), whatsappUrl: z.url().refine(v => new URL(v).hostname === 'wa.me' || new URL(v).hostname === 'api.whatsapp.com'), whatsappConfirmed: z.boolean(), qrUrl: z.union([safeMedia, z.literal('')]), qrDestination: z.union([z.url().refine(v => ['wa.me', 'api.whatsapp.com'].includes(new URL(v).hostname)), z.literal('')]) }).strict();
export const inquiryUpdateSchema = z.object({ status: z.enum(['new', 'contacted', 'quoted', 'closed']), notes: text(5000) }).strict();
export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(256) }).strict();
