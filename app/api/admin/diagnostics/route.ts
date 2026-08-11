import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ADMIN_EMAILS = ['ansh@kaksha.ai', 'ansh28babbar@gmail.com'];

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all diagnostic sessions
  const diagnosticSessions = await prisma.session.findMany({
    where: { type: 'DIAGNOSTIC' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          profile: {
            select: {
              strengths: true,
              weaknesses: true,
              kakshaScore: true,
              targetExamYear: true,
              onboardingCompleted: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ diagnostics: diagnosticSessions });
}
