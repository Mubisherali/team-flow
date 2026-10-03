// -------------------------------------------------------------
// NextAuth v4 Configuration - The Brain of Authentication
// -------------------------------------------------------------
//
// WHY v4 (NOT v5):
// - v4 is stable, battle-tested, works perfectly with Next.js 16
// - v4 uses `authOptions` object (cleaner for our needs)
// - v4's `withAuth` middleware works reliably in Next.js 16
// - v5 is still in beta and has issues with Next.js 16
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
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators/auth';

export const authOptions = {
  // -----------------------------------------------------------
  // PROVIDERS - How does a user log in?
  // -----------------------------------------------------------
  providers: [
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
    // Copy user.id into the JWT token.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Copy token.id into session.user.id.
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
  // DEBUG - verbose logs in dev only
  // -----------------------------------------------------------
  debug: process.env.NODE_ENV === 'development',
};