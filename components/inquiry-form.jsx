'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { inquirySchema } from '../lib/validation.js';
import { t } from '../lib/copy.js';
import { track } from './analytics.jsx';
export default function InquiryForm({ locale, products, selectedProduct = '' }) {
  const c = t(locale); const path = usePathname(); const key = useRef(null); const [pending, setPending] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState(''); const [fields, setFields] = useState([]);
  const selected = products.some(p => p.id === selectedProduct) ? selectedProduct : '';
  async function submit(event) {
    event.preventDefault(); if (pending) return; setError(''); setFields([]);
    const form = new FormData(event.currentTarget); if (!key.current) key.current = crypto.randomUUID();
    const data = Object.fromEntries(form); data.quantity = data.quantity ? Number(data.quantity) : null; data.consent = form.get('consent') === 'on'; data.locale = locale; data.sourcePage = path; data.requestId = key.current;
    const validation = inquirySchema.safeParse(data);
    if (!validation.success) { setFields([...new Set(validation.error.issues.map(i => i.path[0]))]); setError(validation.error.issues.some(i => i.message === 'contact_required') ? c.noContact : c.invalid); return; }
    setPending(true);
    try { const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validation.data) }); const result = await response.json(); if (!response.ok || !result.received) { setFields(result.fields || []); throw new Error('failed'); } setSaved(true); track('Inquiry received'); }
    catch { setError(c.failed); } finally { setPending(false); }
  }
  const invalid = name => fields.includes(name);
  const labels = { fullName: c.fullName, company: c.company, country: c.country, email: c.email, phone: c.phone, destination: c.destination };
  const input = (name, type = 'text', required = false, autoComplete) => <label className="form-field" key={name}>{labels[name]} {required && <span className="required-mark">*</span>}<input name={name} type={type} required={required} maxLength={name === 'email' ? 254 : name === 'phone' ? 40 : 160} autoComplete={autoComplete} aria-invalid={invalid(name)} aria-describedby={invalid(name) ? 'form-error' : undefined}/></label>;
  if (saved) return <div className="form-success" role="status"><CheckCircle2 size={48}/><h2>{c.saved}</h2><p>{locale === 'ru' ? 'Наша команда рассмотрит ваши требования и свяжется с вами по указанному контакту.' : 'Our team will review your requirements and use your contact details to reply.'}</p><Link className="button button-outline" href={`/${locale}/products`}>{c.explore}</Link></div>;
  return <form onSubmit={submit} onChange={() => { if (!pending) key.current = null; }} className="inquiry-form" aria-busy={pending}><p className="form-help">{c.contactHint}</p><div className="form-grid">
    {input('fullName', 'text', true, 'name')}{input('company', 'text', false, 'organization')}{input('country', 'text', false, 'country-name')}{input('email', 'email', false, 'email')}{input('phone', 'tel', false, 'tel')}
    <label className="form-field">{c.interested}<select name="productId" defaultValue={selected} aria-invalid={invalid('productId')}><option value="">{c.any}</option>{products.map(p => <option key={p.id} value={p.id}>{p.content[locale].name}</option>)}</select></label>
    <div className="quantity-fields"><label className="form-field">{c.quantity}<input name="quantity" type="number" min="0.001" max="1000000" step="any" inputMode="decimal" aria-invalid={invalid('quantity')}/></label><label className="form-field">{c.unit}<select name="unit">{Object.entries(c.units).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {input('destination')}<label className="form-field form-wide">{c.message}<textarea name="message" maxLength={3000} rows={5} aria-invalid={invalid('message')}/></label>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="consent form-wide"><input name="consent" type="checkbox" required aria-invalid={invalid('consent')}/><span>{c.consent} <Link href={`/${locale}/privacy`}>{c.privacy}</Link></span></label>
  </div>{error && <p id="form-error" className="form-error" role="alert">{error}</p>}<div className="form-bottom"><button type="submit" className="button" disabled={pending}><Send size={18}/>{pending ? c.sending : c.send}</button><span><ShieldCheck size={20}/>{locale === 'ru' ? 'Ваш запрос передается нашей команде.' : 'Your inquiry goes to our export team.'}</span></div></form>;
}
