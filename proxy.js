import { NextResponse } from 'next/server';
export function proxy(request) {
  const headers = new Headers(request.headers);
  const locale = request.nextUrl.pathname.split('/')[1];
  headers.set('x-site-locale', locale === 'ru' ? 'ru' : 'en');
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ['/((?!api|_next/static|_next/image|media|favicon.ico).*)'] };
