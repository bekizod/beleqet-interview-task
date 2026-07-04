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
  '/profile/*',
  '/applications/*',
  '/my-jobs/*',
  '/notifications/*',
  '/wallet/*',
  '/post-job/*',
  '/freelance/my-bids/*',
  '/freelance/contracts/*',
];

// Admin routes - require admin role
const adminPaths = [
  '/admin/dashboard',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Check if the path is admin-related
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));

  // Handle admin register page with conditional access
  if (pathname.startsWith('/admin/register')) {
    // If admin is already logged in, redirect to dashboard
    if (accessToken && userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Check if there are any admins in the database
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/admin/check-admins`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // If admins exist, redirect to admin login
        if (data.hasAdmins) {
          return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        // If no admins exist, allow public access
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // On error, allow access but page will handle the check
    }
  }

  // Handle admin login page - redirect if already logged in as admin
  if (pathname.startsWith('/admin/login')) {
    if (accessToken && userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // If user is authenticated and tries to access public paths, redirect to home
  if (accessToken && isPublicPath) {
    console.log("accesstoken=", accessToken, "isPublicPath=", isPublicPath)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and tries to access protected paths, redirect to login
  if (!accessToken && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated but not admin and tries to access admin paths, redirect to home
  if (accessToken && isAdminPath && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and tries to access admin paths, redirect to admin login
  if (!accessToken && isAdminPath) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};