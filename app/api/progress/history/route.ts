import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const dbUser = await prisma.user.findFirst();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'No user in DB', code: ErrorCode.NOT_FOUND }, { status: 400 });
    }
    const userId = dbUser.id;

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
    const mockProgress = await prisma.session.findMany({
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
