import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ADMIN_EMAILS = ['ansh@kaksha.ai', 'ansh28babbar@gmail.com'];

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [totalUsers, totalAttempts, attemptsToday, newUsersToday, onlineUsers] = await Promise.all([
    prisma.user.count(),
    prisma.questionAttempt.count(),
    prisma.questionAttempt.count({ where: { attemptedAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    // "online" = attempted a question in the last 5 min
    prisma.questionAttempt.findMany({
      where: { attemptedAt: { gte: fiveMinutesAgo } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalAttempts,
    attemptsToday,
    newUsersToday,
    onlineUsers: onlineUsers.length,
  });
}
