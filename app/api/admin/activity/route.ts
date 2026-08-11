import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ADMIN_EMAILS = ['ansh@kaksha.ai', 'ansh28babbar@gmail.com'];

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const skip = (page - 1) * limit;
  const userFilter = searchParams.get('user') || '';
  const resultFilter = searchParams.get('result') || ''; // 'correct' | 'incorrect' | ''

  const where: Record<string, unknown> = {};
  if (userFilter) {
    where.user = {
      OR: [
        { email: { contains: userFilter, mode: 'insensitive' } },
        { name: { contains: userFilter, mode: 'insensitive' } },
      ],
    };
  }
  if (resultFilter === 'correct') where.isCorrect = true;
  if (resultFilter === 'incorrect') where.isCorrect = false;

  const [total, attempts] = await Promise.all([
    prisma.questionAttempt.count({ where }),
    prisma.questionAttempt.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        question: { select: { topic: true, subtopic: true, section: true } },
      },
      orderBy: { attemptedAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({ total, page, limit, attempts });
}
