'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { t } from '../lib/copy.js';
export default function SiteError({ reset }) { const locale = useParams()?.locale === 'ru' ? 'ru' : 'en'; const c = t(locale); return <main className="container section not-found"><Link className="wordmark" href={`/${locale}`}><span>sun</span>exportco.</Link><h1 style={{ marginTop: 40 }}>{c.error}</h1><p>{locale === 'ru' ? 'Повторите попытку позже или позвоните нашей команде.' : 'Please retry shortly or call our export team.'}</p><div className="button-group"><button className="button" onClick={reset}>{c.retry}</button><a className="button button-outline" href="tel:+989201528232">+98 920 152 8232</a></div></main>; }
