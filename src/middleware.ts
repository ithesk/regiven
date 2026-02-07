import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    const sessionCookie = request.cookies.get('admin_session');

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Validate session exists in store (will be done in API)
    // Just check cookie exists for now
  }

  // Check if accessing main donation page
  if (pathname === '/') {
    // We'll check portal status client-side or in page component
    // to avoid middleware complexity with the store
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard', '/'],
};
