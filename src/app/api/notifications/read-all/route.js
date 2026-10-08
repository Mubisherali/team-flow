// -------------------------------------------------------------
// POST /api/notifications/read-all
// -------------------------------------------------------------
//
// Mark ALL of the current user's unread notifications as read.
//
// WHY POST (not PATCH):
//   Semantically this is "create a bulk action" — it's not
//   updating one resource, it's triggering a state change
//   across many. Either POST or PATCH works. POST is fine.
//
// IDEMPOTENT:
//   Calling when there are no unread → returns success with
//   count: 0. No error.
//
// RESPONSE:
//   { message, count }
//   count = how many notifications were actually updated
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // ─── Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Update all unread to read ───
    // Only touches the current user's notifications.
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: 'All marked as read',
      count: result.count,
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_READ_ALL_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}