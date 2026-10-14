'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Globe2, Phone, ArrowRight } from 'lucide-react';
import { t } from '../lib/copy.js';
export function Wordmark() { return <span className="wordmark"><span>sun</span>exportco<span className="wordmark-dot">.</span></span>; }
export default function Header({ locale, products, settings }) {
  const c = t(locale); const path = usePathname(); const search = useSearchParams(); const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  useEffect(() => { if (!open) return; document.getElementById('mobile-menu')?.querySelector('a')?.focus(); const escape = event => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, [open]);
  const other = locale === 'en' ? 'ru' : 'en';
  let equivalent = path.replace(/^\/(en|ru)/, `/${other}`);
  if (path.startsWith(`/${locale}/products/`)) { const product = products.find(p => p.content[locale].slug === path.split('/').at(-1)); if (product) equivalent = `/${other}/products/${product.content[other].slug}`; }
  if (search.get('product') && /\/(contact|request-quote)$/.test(path)) equivalent += `?product=${encodeURIComponent(search.get('product'))}`;
  const links = [['', c.home], ['/products', c.products], ['/export-packaging', c.export], ['/about', c.about], ['/faq', c.faq], ['/contact', c.contact]];
  return <header className="site-header"><div className="header-inner">
    <Link href={`/${locale}`} aria-label="SunExportCo" className="brand" onClick={() => setOpen(false)}><Wordmark /></Link>
    <nav aria-label={c.menu} className="desktop-nav">{links.map(([href, label]) => <Link key={href} href={`/${locale}${href}`} aria-current={path === `/${locale}${href}` || (href === '/products' && path.includes('/products/')) ? 'page' : undefined}>{label}</Link>)}</nav>
    <div className="header-actions"><Link className="language-switch" href={equivalent} aria-label={`${c.language}: ${other.toUpperCase()}`}><Globe2 size={17} /><span>{locale.toUpperCase()} <span aria-hidden="true">/</span> <b>{other.toUpperCase()}</b></span></Link><a className="header-phone" href={`tel:${settings.phone}`} aria-label={c.call} data-event="Phone click"><Phone size={19} /></a><Link className="button header-quote" href={`/${locale}/request-quote`} data-event="Quote click">{c.quote}<ArrowRight size={16} /></Link><button ref={menuButton} className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? c.close : c.menu} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
    {open && <nav className="mobile-menu" id="mobile-menu" aria-label={c.menu}>{links.map(([href, label]) => <Link key={href} href={`/${locale}${href}`} onClick={() => setOpen(false)} aria-current={path === `/${locale}${href}` ? 'page' : undefined}>{label}</Link>)}<Link className="button" href={`/${locale}/request-quote`} onClick={() => setOpen(false)}>{c.quote}<ArrowRight size={18}/></Link><a href={`tel:${settings.phone}`} data-event="Phone click">{c.call}: {settings.phoneDisplay}</a></nav>}
  </div></header>;
}
