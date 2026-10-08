import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const development = process.env.NODE_ENV === 'development';
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", // R3F canvas sizing and controlled React styles.
    "img-src 'self' blob: data:", "font-src 'self'", "media-src 'self' blob:",
    `connect-src 'self'${development ? ' ws: wss:' : ''}`,
    "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; ');
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

// Public catalog/static files keep their caching, without per-request CSP nonces.
export const config = { matcher: ['/((?!api|_next/static|_next/image|models/|reference-images/|favicon.ico).*)'] };
