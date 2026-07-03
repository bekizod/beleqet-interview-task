import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes - accessible without authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

// Protected routes - require authentication
const protectedPaths = [
  '/profile',
  '/applications',
  '/my-jobs',
  '/notifications',
  '/wallet',
  '/post-job',
  '/freelance/my-bids',
  '/freelance/contracts',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // If user is authenticated and tries to access public paths, redirect to home
  if (accessToken && isPublicPath) {
    console.log("accesstoken=",accessToken, "isPublicPath=", isPublicPath)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and tries to access protected paths, redirect to login
  if (!accessToken && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};