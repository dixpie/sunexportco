'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LockKeyhole, ArrowRight } from 'lucide-react';
export default function AdminLogin() {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function login(event) { event.preventDefault(); setPending(true); setError(''); const data = Object.fromEntries(new FormData(event.currentTarget)); try { const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.error === 'validation' ? 'Enter a valid email and password.' : result.error); router.replace('/admin'); router.refresh(); } catch (err) { setError(err.message || 'Unable to sign in. Retry.'); } finally { setPending(false); } }
  return <main className="admin-login"><Link className="wordmark" href="/en"><span>sun</span>exportco.</Link><form onSubmit={login} className="admin-login-card"><span className="icon-circle"><LockKeyhole size={27}/></span><h1>Welcome back</h1><p>Sign in to manage your catalog and buyer inquiries.</p><label className="form-field">Email<input type="email" name="email" autoComplete="username" required maxLength={254}/></label><label className="form-field">Password<input type="password" name="password" autoComplete="current-password" required maxLength={256}/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}<ArrowRight size={18}/></button><p className="muted">Access is restricted to authorized administrators.</p></form></main>;
}
