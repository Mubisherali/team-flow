
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validators/user';

// =============================================================
// GET — Current user
// =============================================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        // Which OAuth providers are linked? Useful for the
        // "Connected accounts" section on the profile page.
        accounts: {
          select: { provider: true, providerAccountId: true },
        },
      },
    });

    if (!user) {
      // Session references a user that's no longer in the DB.
      // Treat as unauthorized (forces a re-login).
      return NextResponse.json(
        { error: 'Your session is invalid. Please log in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        providers: user.accounts.map((a) => a.provider),
      },
    });
  } catch (error) {
    console.error('[USER_ME_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH — Update profile
// =============================================================
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Validate body ───
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, avatarUrl } = parsed.data;

    // ─── Build partial update payload ───
    // Only include fields the client actually sent.
    const data = {};
    if (name !== undefined) data.name = name;
    if (avatarUrl !== undefined) {
      // Empty string → clear the avatar (store null).
      data.avatarUrl = avatarUrl === '' ? null : avatarUrl;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // ─── Update ───
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated',
      user: updated,
    });
  } catch (error) {
    console.error('[USER_ME_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// =============================================================
// DELETE — Delete the current user's account
// =============================================================
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // ─── Step 1: Confirm the user exists ───
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Session is invalid. Please log in again.' },
        { status: 401 }
      );
    }

    // ─── Step 2: Safety check — no owned workspaces ───
    const ownedCount = await prisma.workspace.count({
      where: { ownerId: userId },
    });

    if (ownedCount > 0) {
      return NextResponse.json(
        {
          error: `You own ${ownedCount} workspace${
            ownedCount === 1 ? '' : 's'
          }. Delete or transfer ${
            ownedCount === 1 ? 'it' : 'them'
          } before deleting your account.`,
          ownedCount,
        },
        { status: 409 }
      );
    }

    // ─── Step 3: Optional password confirmation for credentials users ───
    // If the user has a passwordHash (i.e. signed up with email/password),
    // require them to confirm their password before deleting.
    //
    // If they're OAuth-only (no passwordHash), skip this check —
    // there's nothing to confirm.
    //
    // Body: { password?: string }
    if (user.passwordHash) {
      let body;
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const password = body?.password;

      if (!password) {
        return NextResponse.json(
          { error: 'Please confirm your password to delete your account' },
          { status: 400 }
        );
      }

      const matches = await bcrypt.compare(password, user.passwordHash);
      if (!matches) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 403 }
        );
      }
    }

    // ─── Step 4: Delete the user ───
    // Cascade rules on the schema handle cleanup:
    //   - workspace_members rows (where this user is a member)
    //   - project_members rows (where this user is a member)
    //   - comments authored by this user
    //   - notifications owned by this user
    //   - accounts linked to this user
    //   - invitations sent by this user
    //   - tasks created by this user (⚠️ cascade — see note below)
    //
    // Tasks they were ASSIGNED to: assigneeId → null (SetNull)
    // They can't own workspaces (we checked in Step 2).
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('[USER_ME_DELETE_ERROR]', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}