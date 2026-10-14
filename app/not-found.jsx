import { headers } from 'next/headers';
import Link from 'next/link';
import { t } from '../lib/copy.js';
export default async function NotFound() { const locale = (await headers()).get('x-site-locale') === 'ru' ? 'ru' : 'en'; const c = t(locale); return <main className="container section not-found"><p className="eyebrow">404 · SUNEXPORTCO</p><h1>{c.notFound}</h1><p>{c.notFoundSub}</p><Link className="button" href={`/${locale}`}>{c.home}</Link></main>; }
