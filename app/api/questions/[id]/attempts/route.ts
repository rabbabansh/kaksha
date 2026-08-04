import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId = generateCorrelationId();
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as { id?: string })?.id;
    if (!userId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      const dbUser = await prisma.user.findFirst({ orderBy: { questionAttempts: { _count: 'desc' } } });
      if (!dbUser) {
        return NextResponse.json({ success: false, error: 'No user in DB', code: ErrorCode.NOT_FOUND }, { status: 400 });
      }
      userId = dbUser.id;
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Question ID is required' }, { status: 400 });
    }

    const attempts = await prisma.questionAttempt.findMany({
      where: {
        questionId: id,
        userId: userId
      },
      orderBy: {
        attemptedAt: 'desc'
      },
      take: 10 // Show last 10 attempts
    });

    return NextResponse.json({
      success: true,
      data: attempts,
      correlationId
    });
  } catch (error) {
    console.error('Failed to fetch attempts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
