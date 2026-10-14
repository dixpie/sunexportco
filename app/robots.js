import { url } from '../lib/seo.js';
export const dynamic = 'force-dynamic';
export default function robots() { return process.env.ALLOW_INDEXING === 'true' ? { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/*?'] }, sitemap: url('/sitemap.xml') } : { rules: { userAgent: '*', disallow: '/' } }; }
