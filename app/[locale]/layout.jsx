import { notFound } from 'next/navigation';
import Script from 'next/script';
import Header from '../../components/header.jsx';
import Analytics from '../../components/analytics.jsx';
import { Footer, ContactActions } from '../../components/site.jsx';
import { getProducts, getSettings } from '../../lib/data.js';
import { locales, t } from '../../lib/copy.js';
import { JsonLd, url } from '../../lib/seo.js';
export async function generateMetadata() { return { verification: { google: process.env.SEARCH_CONSOLE_VERIFICATION || undefined } }; }
export default async function PublicLayout({ children, params }) {
  const { locale } = await params; if (!locales.includes(locale)) notFound(); const c = t(locale);
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  return <><a className="skip-link" href="#main">{c.skip}</a><Header locale={locale} products={products} settings={settings}/><main id="main">{children}</main><Footer locale={locale} products={products} settings={settings}/><ContactActions locale={locale} settings={settings}/><JsonLd value={{ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', '@id': url('/#organization'), name: 'SunExportCo', url: url('/en'), telephone: settings.phone, ...(settings.email ? { email: settings.email } : {}) }, { '@type': 'WebSite', '@id': url('/#website'), name: 'SunExportCo', url: url('/en'), inLanguage: ['en', 'ru'], publisher: { '@id': url('/#organization') } }] }}/><Analytics/>{process.env.ANALYTICS_SCRIPT_URL && process.env.ANALYTICS_DOMAIN && <Script defer data-domain={process.env.ANALYTICS_DOMAIN} src={process.env.ANALYTICS_SCRIPT_URL} strategy="afterInteractive"/>}</>;
}
