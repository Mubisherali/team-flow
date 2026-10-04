// -------------------------------------------------------------
// NextAuth v4 Configuration - The Brain of Authentication
// -------------------------------------------------------------
//
// SUPPORTS:
//   - Credentials (email + password)
//   - Google OAuth
//
// STRATEGY:
// JWT sessions. Google account links are stored in the
// `accounts` table.
//
// WHAT THIS FILE EXPORTS:
//   - authOptions : the config object used by NextAuth and
//                   getServerSession() for reading sessions
//
// USAGE ELSEWHERE:
//   - In /api/auth/[...nextauth]/route.js: NextAuth(authOptions)
//   - In server components: getServerSession(authOptions)
//   - In client components: useSession() from next-auth/react
// -------------------------------------------------------------

import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators/auth';

export const authOptions = {
  // -----------------------------------------------------------
  // PROVIDERS - How does a user log in?
  // -----------------------------------------------------------
  providers: [
    // --- Credentials (email + password) ---
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      // -------------------------------------------------------
      // authorize() - Where login actually happens
      // -------------------------------------------------------
      // Return a user object on success, null on failure.
      async authorize(credentials) {
        // Step A: Validate input with Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Step B: Find the user in the database
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        // Step C: Compare passwords
        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (!passwordMatches) return null;

        // Step D: Return the user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),

    // --- Google OAuth ---
    // Client ID + Secret come from Google Cloud Console.
    // The redirect URI configured there must point to:
    //   http://localhost:3000/api/auth/callback/google
    //   https://your-app.vercel.app/api/auth/callback/google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true
    }),
  ],

  // -----------------------------------------------------------
  // SESSION STRATEGY
  // -----------------------------------------------------------
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // -----------------------------------------------------------
  // CUSTOM PAGES
  // -----------------------------------------------------------
  pages: {
    signIn: '/login',
  },

  // -----------------------------------------------------------
  // CALLBACKS
  // -----------------------------------------------------------
  callbacks: {
    // -------------------------------------------------------
    // jwt() - runs when a JWT is created or updated.
    // -------------------------------------------------------
    // On first sign-in (either provider), copy `user.id` into
    // the token. Note: for OAuth, NextAuth's adapter creates
    // the User row and gives us the DB id here.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // -------------------------------------------------------
    // session() - runs when the session is read.
    // -------------------------------------------------------
    // Expose `token.id` as `session.user.id`.
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },

  // -----------------------------------------------------------
  // SECRET - signs the JWT
  // -----------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,

  // -----------------------------------------------------------
  // TRUST HOST
  // -----------------------------------------------------------
  // Required for Next.js 16 on Vercel. Without it, you get
  // "UntrustedHost" errors because Next.js 16 doesn't set the
  // host header the way NextAuth v4 expects.
  trustHost: true,

  // -----------------------------------------------------------
  // DEBUG - verbose logs in dev only
  // -----------------------------------------------------------
  debug: process.env.NODE_ENV === 'development',
};