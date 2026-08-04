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
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Question ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const attempts = await prisma.questionAttempt.findMany({
      where: {
        userId: user.id,
        questionId: id
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
