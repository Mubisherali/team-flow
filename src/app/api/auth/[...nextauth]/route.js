// -------------------------------------------------------------
// NextAuth API Route - v4 Pattern
// -------------------------------------------------------------
//
// WHAT THIS FILE DOES:
// Exposes NextAuth's HTTP endpoints under /api/auth/*.
//
// HOW v4 DIFFERS FROM v5:
//   v4: NextAuth(authOptions) returns a single handler.
//       We export it AS BOTH GET and POST.
//   v5: NextAuth() returned `handlers` with GET/POST inside.
//
// WHY BOTH GET AND POST:
// NextAuth uses GET for reading session/csrf, POST for
// signin/signout. Exporting the same handler twice lets
// Next.js route both methods to it.
//
// USAGE FROM THE FRONTEND:
//   signIn('credentials', {...})  -> POST /api/auth/callback/credentials
//   signOut()                    -> POST /api/auth/signout
//   useSession()                 -> GET  /api/auth/session
// -------------------------------------------------------------

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth(...) returns one handler function.
const handler = NextAuth(authOptions);

// Export the SAME handler for both GET and POST.
// Next.js App Router needs named exports per HTTP method.
export { handler as GET, handler as POST };