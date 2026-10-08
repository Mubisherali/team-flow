// -------------------------------------------------------------
// PATCH /api/notifications/[id]
// -------------------------------------------------------------
//
// Mark a single notification as read.
//
// AUTH:
//   Must be logged in. Can only update YOUR OWN notifications.
//   Attempts to modify someone else's → 404 (don't leak existence).
//
// IDEMPOTENT:
//   Marking an already-read notification is a no-op. Returns 200.
//
// RESPONSE:
//   { message, notification }
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    // ─── Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // ─── Load the notification ───
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, isRead: true },
    });

    // ─── Not found OR belongs to someone else → 404 ───
    // We don't distinguish between the two. This prevents
    // guessing valid notification ids.
    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // ─── Already read → no-op ───
    if (notification.isRead) {
      return NextResponse.json({
        message: 'Already read',
        notification,
      });
    }

    // ─── Mark as read ───
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: 'Marked as read',
      notification: updated,
    });
  } catch (error) {
    console.error('[NOTIFICATION_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}