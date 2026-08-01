import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserProgressStats } from '@/lib/progress';
import prisma from '@/lib/prisma';
import { logger, createTimer } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET() {
  const correlationId = generateCorrelationId();
  const timer = createTimer();
  const operation = 'get_progress_stats';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      logger.warn(`${operation} unauthorized access attempt`, { operation, correlationId });
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      logger.warn(`${operation} user ID not found`, { operation, correlationId });
      return NextResponse.json(
        { success: false, error: 'User ID not found', code: ErrorCode.NOT_FOUND, correlationId },
        { status: 400 }
      );
    }

    const stats = await getUserProgressStats(userId);

    logger.info(`${operation} completed successfully`, {
      operation,
      correlationId,
      duration: timer.elapsed(),
      userId
    });

    return NextResponse.json({
      success: true,
      data: stats,
      correlationId
    });
  } catch (error) {
    logger.error(`${operation} failed`, {
      operation,
      correlationId,
      duration: timer.elapsed(),
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}

