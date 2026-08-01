import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    const { searchParams } = new URL(request.url);
    const subtopic = searchParams.get('subtopic');
    const limit = parseInt(searchParams.get('limit') || '15');

    if (!subtopic) {
      return NextResponse.json({ success: false, error: 'Question ID required', code: ErrorCode.VALIDATION_ERROR, correlationId }, { status: 400 });
    }

    // Fetch the most recent unique questions attempted in this subtopic
    const attempts = await prisma.questionAttempt.findMany({
      where: {
        userId,
        question: {
          subtopic: subtopic
        }
      },
      orderBy: { attemptedAt: 'desc' },
      include: {
        question: true
      }
    });

    // Deduplicate so we only show the latest attempt per question
    const uniqueAttemptsMap = new Map();
    for (const attempt of attempts) {
      if (!uniqueAttemptsMap.has(attempt.questionId)) {
        uniqueAttemptsMap.set(attempt.questionId, attempt);
      }
      if (uniqueAttemptsMap.size >= limit) break;
    }

    const reviewData = Array.from(uniqueAttemptsMap.values());

    return NextResponse.json({
      success: true,
      data: reviewData,
      correlationId
    });

  } catch (error) {
    console.error('Review fetch failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
