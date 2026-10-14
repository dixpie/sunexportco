'use client';
import { useEffect } from 'react';
export function track(name) { if (typeof window !== 'undefined' && typeof window.plausible === 'function') window.plausible(name); }
export default function Analytics() { useEffect(() => { const handler = event => { const link = event.target.closest('[data-event]'); if (link) track(link.dataset.event); }; document.addEventListener('click', handler); return () => document.removeEventListener('click', handler); }, []); return null; }
