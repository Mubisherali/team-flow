import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// -------------------------------------------------------------
// ROUTE GROUPS
// -------------------------------------------------------------
// Auth pages — redirect away if the user is already logged in.
const authRoutes = ['/login', '/register'];

// Protected route prefixes — require authentication.
// We do NOT include '/' — the root landing page is public.
const protectedPrefixes = ['/workspaces', '/settings'];

// -------------------------------------------------------------
// PROXY FUNCTION
// -------------------------------------------------------------
export default withAuth(
  function proxy(req) {
    const { nextUrl } = req;
    const token = req.nextauth.token;
    const isLoggedIn = !!token;
    const path = nextUrl.pathname;

    // Rule 1: Logged-in user visiting /login or /register → /
    if (isLoggedIn && authRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/', nextUrl));
    }

    // Rule 2: Logged-out user visiting a protected route → /login
    const isProtected = protectedPrefixes.some((prefix) =>
      path.startsWith(prefix)
    );

    if (!isLoggedIn && isProtected) {
      const loginUrl = new URL('/login', nextUrl);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }

    // Rule 3: Everything else is allowed (including `/`).
    // The home page component handles its own redirect for
    // logged-in users.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
    pages: {
      signIn: '/login',
    },
  }
);

// -------------------------------------------------------------
// MATCHER — Which routes this proxy runs on
// -------------------------------------------------------------
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};