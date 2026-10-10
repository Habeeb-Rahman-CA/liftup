import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('liftup_access_token')?.value;

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const protectedPrefixes = [
    '/dashboard',
    '/workouts',
    '/meals',
    '/progress',
    '/history',
    '/exercises',
    '/foods',
  ];
  const isProtectedRoute = protectedPrefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // If user is already authenticated and visits login/register, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is unauthenticated and visits protected route, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workouts/:path*',
    '/meals/:path*',
    '/progress/:path*',
    '/history/:path*',
    '/exercises/:path*',
    '/foods/:path*',
    '/login',
    '/register',
  ],
};
