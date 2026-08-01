import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId }, { status: 401 });
    }

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }

    const body = await request.json();
    const { questionId, reason, customReason } = body;

    if (!questionId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing questionId or reason', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    const report = await prisma.reportedQuestion.create({
      data: {
        userId: userId as string,
        questionId,
        reason,
        details: customReason || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      data: { reportId: report.id },
      correlationId
    });

  } catch (error) {
    console.error('Failed to submit report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
