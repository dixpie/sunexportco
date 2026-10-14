import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdmin } from '../../../../../lib/security.js';
import { Product } from '../../../../../lib/models.js';
import { getProducts, getSettings } from '../../../../../lib/data.js';
import ProductDetail from '../../../../../components/product-detail.jsx';
export default async function Preview({ params, searchParams }) { if (!await getAdmin()) redirect('/admin/login'); const { id } = await params; if (!/^[a-z0-9-]{1,80}$/.test(id)) notFound(); const product = await Product.findOne({ id }).lean(); if (!product) notFound(); const locale = (await searchParams).locale === 'ru' ? 'ru' : 'en'; const [products, settings] = await Promise.all([getProducts(), getSettings()]); return <><div className="preview-banner">Private preview · {product.status} · {locale.toUpperCase()} <Link href="/admin">Back to admin</Link></div><ProductDetail product={JSON.parse(JSON.stringify(product))} products={products} settings={settings} locale={locale} preview/></>; }
