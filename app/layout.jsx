import { headers } from 'next/headers';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-700.css';
import './globals.css';
export default async function RootLayout({ children }) { const locale = (await headers()).get('x-site-locale') === 'ru' ? 'ru' : 'en'; return <html lang={locale} dir="ltr"><body>{children}</body></html>; }
