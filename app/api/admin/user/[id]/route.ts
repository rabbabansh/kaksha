import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ADMIN_EMAILS = ['ansh@kaksha.ai', 'ansh28babbar@gmail.com'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [user, attempts, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    }),
    prisma.questionAttempt.findMany({
      where: { userId: id },
      include: {
        question: { select: { topic: true, subtopic: true, section: true } },
      },
      orderBy: { attemptedAt: 'desc' },
      take: 100,
    }),
    prisma.session.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user, attempts, sessions });
}
