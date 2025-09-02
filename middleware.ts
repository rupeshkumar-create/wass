import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSession } from './src/lib/auth/session';

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/nomination/approve',
    '/api/votes/:path*',
    '/api/sync/hubspot/run'
  ],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const cookie = req.cookies.get('admin_session')?.value;
  const session = cookie ? await verifyAdminSession(cookie) : null;
  
  const isApi = url.pathname.startsWith('/api/');
  const isLogin = url.pathname.startsWith('/admin/login');
  const isLogout = url.pathname.startsWith('/api/admin/logout');
  
  // Allow logout endpoint without authentication
  if (isLogout) {
    return NextResponse.next();
  }
  
  // Allow login endpoint without authentication
  if (url.pathname === '/api/admin/login') {
    return NextResponse.next();
  }
  
  if (!session) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin session required' },
        { status: 401 }
      );
    }
    
    if (!isLogin) {
      const login = new URL('/admin/login', url.origin);
      login.searchParams.set('next', url.pathname);
      return NextResponse.redirect(login);
    }
  }
  
  // Forward admin user info to protected API routes
  const res = NextResponse.next();
  if (session && isApi) {
    res.headers.set('x-admin-user', session.userId);
    res.headers.set('x-admin-email', session.email);
  }
  
  // Add security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // CSP for admin pages
  if (url.pathname.startsWith('/admin')) {
    res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none';"
    );
  }
  
  return res;
}