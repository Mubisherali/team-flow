// -------------------------------------------------------------
// NextAuth v4 Configuration - The Brain of Authentication
// -------------------------------------------------------------
//
// SUPPORTS:
//   - Credentials (email + password)
//   - Google OAuth
//   - GitHub OAuth
//
// STRATEGY:
// JWT sessions.
//
// IMPORTANT NOTE ABOUT THE PRISMA ADAPTER:
// In NextAuth v4, when you use `strategy: 'jwt'` AND include a
// Credentials provider, the Prisma adapter is IGNORED for OAuth
// flows. So we can't rely on it to auto-save OAuth users.
//
// The `signIn` callback below handles OAuth user persistence
// MANUALLY: it upserts the user + account into our DB, then
// overwrites `user.id` with the DB cuid so the JWT is correct.
// -------------------------------------------------------------

import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators/auth';

export const authOptions = {
  // -----------------------------------------------------------
  // ADAPTER
  // -----------------------------------------------------------
  adapter: PrismaAdapter(prisma),

  // -----------------------------------------------------------
  // PROVIDERS
  // -----------------------------------------------------------
  providers: [
    // --- Credentials ---
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

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

    // --- GitHub OAuth ---
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // -----------------------------------------------------------
  // SESSION STRATEGY
  // -----------------------------------------------------------
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
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
    // signIn() - Manually persist OAuth users
    // -------------------------------------------------------
    async signIn({ user, account }) {
      // Credentials → user already in DB
      if (account?.provider === 'credentials') {
        return true;
      }

      // OAuth (Google OR GitHub) → upsert user + account
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user.email) return false;

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
          },
        });

        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
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

        // 🔑 Overwrite user.id with the DB cuid
        user.id = dbUser.id;

        return true;
      }

      return true;
    },

    // -------------------------------------------------------
    // jwt() - Build the token
    // -------------------------------------------------------
    // Runs:
    //   1. On initial sign-in (user is provided)
    //   2. On every subsequent request (only token is provided)
    //   3. When the client calls update() — trigger === 'update'
    async jwt({ token, user, trigger, session }) {
      // ─── Initial sign-in: seed the token ───
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      // ─── Client called update({ name, image }) from useSession ───
      // Fired after the user edits their profile. Merge the
      // new values into the token.
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }

      return token;
    },

    // -------------------------------------------------------
    // session() - Shape the client-visible session object
    // -------------------------------------------------------
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
  },

  // -----------------------------------------------------------
  // SECRET
  // -----------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
};