import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files and Next.js internal routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = req.cookies.get('access-token')?.value;

  // Verify token if it exists
  let isValidToken = false;
  if (token) {
    isValidToken = true;
  }

  // Public auth routes (login, register)
  if (pathname.startsWith('/auth/')) {
    // If already logged in with valid token, redirect to dashboard
    if (isValidToken) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard/users';
      return NextResponse.redirect(url);
    }
    // Allow access to auth pages if not logged in
    return NextResponse.next();
  }

  // Root route handling
  if (pathname === '/') {
    if (isValidToken) {
      // Redirect to dashboard if logged in
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard/users';
      return NextResponse.redirect(url);
    } else {
      // Redirect to login if not logged in
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  // Protected routes (everything else)
  if (!isValidToken) {
    // Redirect to login if not logged in or invalid token
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Allow access to protected routes if logged in
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
