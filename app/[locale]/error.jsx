'use client';
import { useParams } from 'next/navigation';
import { t } from '../../lib/copy.js';
export default function ErrorPage({ reset }) { const c = t(useParams().locale); return <section className="container section"><h1>{c.error}</h1><button className="button" onClick={reset}>{c.retry}</button></section>; }
