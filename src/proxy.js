// -------------------------------------------------------------
// Proxy - Route Protection (NextAuth v4 + Next.js 16)
// -------------------------------------------------------------
//
// WHAT THIS FILE DOES:
// Runs BEFORE every page request. Uses NextAuth v4's
// `withAuth` helper to check the session and enforce rules.
//
// HOW withAuth WORKS:
//   - withAuth(middlewareFn, options) returns a proxy function
//   - It reads the session token from the cookie
//   - It calls your middlewareFn with req.auth populated
//   - You return NextResponse to allow/redirect
//
// v4 vs v5:
//   v4: withAuth from 'next-auth/middleware'  ← we use this
//   v5: auth((req) => ...) from '@/lib/auth'  ← broken on Next 16
//
// WHY THIS WORKS ON THE EDGE:
// v4's withAuth only reads the JWT cookie. It does NOT import
// Prisma or bcrypt (which can't run on the edge). It just
// decodes the JWT — perfect for the edge runtime.
// -------------------------------------------------------------

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// -------------------------------------------------------------
// ROUTE GROUPS
// -------------------------------------------------------------
const authRoutes = ['/login', '/register'];
const protectedPrefixes = ['/workspaces', '/projects', '/settings'];

// -------------------------------------------------------------
// PROXY FUNCTION (wrapped by withAuth)
// -------------------------------------------------------------
// `req.nextauth.token` is populated by withAuth. It's null
// if not logged in.
export default withAuth(
  function proxy(req) {
    const { nextUrl } = req;
    const token = req.nextauth.token;
    const isLoggedIn = !!token;
    const path = nextUrl.pathname;

    // Rule 1: Logged-in user visiting /login or /register -> /
    if (isLoggedIn && authRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/', nextUrl));
    }

    // Rule 2: Not-logged-in user visiting a protected page -> /login
    const isProtected =
      path === '/' ||
      protectedPrefixes.some((prefix) => path.startsWith(prefix));

    if (!isLoggedIn && isProtected) {
      const loginUrl = new URL('/login', nextUrl);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }

    // Otherwise: allow the request through
    return NextResponse.next();
  },
  {
    // ---------------------------------------------------------
    // withAuth OPTIONS
    // ---------------------------------------------------------
    // `callbacks.authorized` decides whether the request should
    // proceed. Returning `true` means "let it through"; `false`
    // redirects to the sign-in page.
    //
    // We handle redirection ourselves inside the proxy function
    // above, so we just always return true here and let our
    // logic decide.
    callbacks: {
      authorized: () => true,
    },

    // Which page to send users to when they need to sign in.
    pages: {
      signIn: '/login',
    },
  }
);

// -------------------------------------------------------------
// MATCHER - Which routes this proxy runs on
// -------------------------------------------------------------
// Excludes API routes, static files, image optimization, and
// any file with an extension (e.g. .png, .css, .js).
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};