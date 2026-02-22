import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { logger, createTimer } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const timer = createTimer();
  const operation = 'get_test_progress';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      logger.warn(`${operation} unauthorized access attempt`, { operation, correlationId });
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const slot = searchParams.get('slot');

    if (!year || !slot) {
      return NextResponse.json(
        { success: false, error: 'Year and slot are required', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
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

    const progress = await prisma.testProgress.findUnique({
      where: {
        userId_year_slot: {
          userId,
          year,
          slot,
        },
      },
    });

    logger.info(`${operation} completed successfully`, {
      operation,
      correlationId,
      duration: timer.elapsed(),
      userId,
      found: !!progress
    });

    if (!progress) {
      return NextResponse.json({ success: true, data: null, correlationId });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        answers: JSON.parse(progress.answers),
        flagged: JSON.parse(progress.flagged),
      },
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

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const timer = createTimer();
  const operation = 'save_test_progress';

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

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn(`${operation} invalid request format`, { operation, correlationId, error: String(parseError) });
      return NextResponse.json(
        { success: false, error: 'Invalid request format', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }
    const { year, slot, answers, flagged, timeRemaining, currentSection, completed, score } = body;

    if (!year || !slot) {
      return NextResponse.json(
        { success: false, error: 'Year and slot are required', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    const progress = await prisma.testProgress.upsert({
      where: {
        userId_year_slot: {
          userId,
          year,
          slot,
        },
      },
      update: {
        answers: JSON.stringify(answers || {}),
        flagged: JSON.stringify(flagged || []),
        timeRemaining: timeRemaining ?? undefined,
        currentSection: currentSection ?? undefined,
        completed: completed ?? false,
        score: score ?? undefined,
      },
      create: {
        userId,
        year,
        slot,
        answers: JSON.stringify(answers || {}),
        flagged: JSON.stringify(flagged || []),
        timeRemaining: timeRemaining ?? undefined,
        currentSection: currentSection ?? undefined,
        completed: completed ?? false,
        score: score ?? undefined,
      },
    });

    logger.info(`${operation} completed successfully`, {
      operation,
      correlationId,
      duration: timer.elapsed(),
      userId
    });

    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        answers: JSON.parse(progress.answers),
        flagged: JSON.parse(progress.flagged),
      },
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
