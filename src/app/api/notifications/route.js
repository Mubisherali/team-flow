// -------------------------------------------------------------
// GET /api/notifications
// -------------------------------------------------------------
//
// Returns the current user's notifications, newest first.
//
// AUTH: must be logged in. Users only see their own.
//
// QUERY PARAMS:
//   limit   : number (default 20, max 50)
//   unread  : 'true' → return only unread
//
// RESPONSE:
//   {
//     notifications: [ { id, type, message, link, isRead, createdAt } ],
//     unreadCount: number   // total unread (not limited)
//   }
//
// WHY unreadCount SEPARATE:
//   The dropdown shows the latest 20, but the badge should count
//   ALL unread. So we send both.
// -------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // ─── Auth ───
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Parse query params ───
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(limitParam, 1), 50); // 1..50
    const unreadOnly = searchParams.get('unread') === 'true';

    // ─── Fetch notifications + unread count in parallel ───
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}