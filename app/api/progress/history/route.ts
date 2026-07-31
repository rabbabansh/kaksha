import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED }, { status: 401 });
    }

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID not found', code: ErrorCode.NOT_FOUND }, { status: 400 });
    }

    // Fetch all question attempts (no limit, per user request)
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      include: {
        question: {
          select: {
            topic: true,
            subtopic: true,
            section: true,
            source: true
          }
        }
      }
    });

    // Also fetch mock tests progress
    const mockProgress = await prisma.testProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        attempts,
        mockProgress
      },
      correlationId
    });

  } catch (error) {
    console.error('History fetch failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
