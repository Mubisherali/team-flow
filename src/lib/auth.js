// -------------------------------------------------------------
// NextAuth v4 Configuration - The Brain of Authentication
// -------------------------------------------------------------
//
// SUPPORTS:
//   - Credentials (email + password)
//   - Google OAuth
//
// STRATEGY:
// JWT sessions.
//
// IMPORTANT NOTE ABOUT THE PRISMA ADAPTER:
// In NextAuth v4, when you use `strategy: 'jwt'` AND include a
// Credentials provider, the Prisma adapter is IGNORED for OAuth
// flows. So we can't rely on it to auto-save Google users.
//
// The `signIn` callback below handles OAuth user persistence
// MANUALLY: it upserts the user + account into our DB, then
// overwrites `user.id` with the DB cuid so the JWT is correct.
// -------------------------------------------------------------

import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators/auth';

export const authOptions = {
  // -----------------------------------------------------------
  // ADAPTER
  // -----------------------------------------------------------
  // Kept in place for future use (e.g., if we ever switch to
  // database sessions or add more providers that DO use it).
  // Currently, our signIn callback does the heavy lifting.
  adapter: PrismaAdapter(prisma),

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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Google-only users have no passwordHash → reject.
        if (!user || !user.passwordHash) return null;

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (!passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),

    // --- Google OAuth ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
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
    // signIn() - runs when a user signs in
    // -------------------------------------------------------
    // This is where we MANUALLY save OAuth users to the DB
    // because the v4 adapter is ignored for JWT + credentials.
    //
    // For credentials: user already exists → just allow.
    // For Google:      upsert user + account, then replace
    //                  user.id with the DB cuid so the JWT
    //                  carries the correct ID.
    async signIn({ user, account }) {
      // --- Credentials path ---
      if (account?.provider === 'credentials') {
        return true;
      }

      // --- Google path ---
      if (account?.provider === 'google') {
        if (!user.email) return false;

        // Upsert the user by email. Reuses the row if it exists.
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            avatarUrl: user.image ?? undefined,
            name: user.name ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
            // No passwordHash - this is a Google-only user.
          },
        });

        // Upsert the account link.
        // Requires the compound unique in the schema:
        //   @@unique([provider, providerAccountId])
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            id_token: account.id_token,
            scope: account.scope,
            token_type: account.token_type,
            session_state: account.session_state,
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            id_token: account.id_token,
            scope: account.scope,
            token_type: account.token_type,
            session_state: account.session_state,
          },
        });

        // 🔑 CRITICAL: overwrite user.id with our DB cuid.
        // Without this, the JWT would contain Google's sub ID
        // (e.g. "110092818158740091425"), breaking FK constraints
        // everywhere we reference session.user.id.
        user.id = dbUser.id;

        return true;
      }

      // Unknown provider → allow (shouldn't happen).
      return true;
    },

    // -------------------------------------------------------
    // jwt() - runs when a JWT is created or updated.
    // -------------------------------------------------------
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // -------------------------------------------------------
    // session() - runs when the session is read.
    // -------------------------------------------------------
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },

  // -----------------------------------------------------------
  // SECRET
  // -----------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,

  // -----------------------------------------------------------
  // TRUST HOST - required for Next.js 16 / Vercel
  // -----------------------------------------------------------
  trustHost: true,

  // -----------------------------------------------------------
  // DEBUG
  // -----------------------------------------------------------
  debug: process.env.NODE_ENV === 'development',
};