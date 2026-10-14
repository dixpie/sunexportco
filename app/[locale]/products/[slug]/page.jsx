import { notFound } from 'next/navigation';
import { getProduct, getProducts, getSettings } from '../../../../lib/data.js';
import { metadata } from '../../../../lib/seo.js';
import { locales } from '../../../../lib/copy.js';
import ProductDetail from '../../../../components/product-detail.jsx';
export async function generateMetadata({ params }) { const { locale, slug } = await params; if (!locales.includes(locale)) return {}; const product = await getProduct(locale, slug); if (!product) return {}; const content = product.content[locale]; return metadata(locale, `/products/${slug}`, content.seoTitle || `${content.name} | SunExportCo`, content.seoDescription || content.description, { en: `/en/products/${product.content.en.slug}`, ru: `/ru/products/${product.content.ru.slug}` }); }
export default async function ProductPage({ params }) { const { locale, slug } = await params; if (!locales.includes(locale)) notFound(); const [product, products, settings] = await Promise.all([getProduct(locale, slug), getProducts(), getSettings()]); if (!product) notFound(); return <ProductDetail product={product} products={products} settings={settings} locale={locale}/>; }
