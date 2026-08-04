import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateUserProgress } from '@/lib/progress';
import { logger, createTimer } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const timer = createTimer();
  const operation = 'record_progress_attempt';

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
      // Fallback for MVP testing if no session
      const dbUser = await prisma.user.findFirst();
      if (dbUser) {
        userId = dbUser.id;
      }
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
    const { questionId, userAnswer, source = 'chat', timeTaken } = body;

    if (!questionId || !userAnswer) {
      return NextResponse.json(
        { success: false, error: 'questionId and userAnswer are required', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    const question = await prisma.questions.findUnique({
      where: { question_id: questionId },
      select: { answer: true },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found', code: ErrorCode.NOT_FOUND, correlationId },
        { status: 404 }
      );
    }

    const isCorrect =
      question.answer?.trim().toUpperCase() === userAnswer.trim().toUpperCase();

    await prisma.questionAttempt.create({
      data: {
        userId,
        questionId,
        userAnswer,
        isCorrect,
        source,
        timeTaken: typeof timeTaken === 'number' ? timeTaken : null,
      },
    });

    // Restore updateUserProgress cascade for immediate consistency. 
    // This ensures Daily Task tracking and Kaksha score stays up to date 
    // even if session/complete is missed due to a race condition.
    await updateUserProgress(userId, questionId, isCorrect, source);

    logger.info(`${operation} completed successfully`, {
      operation,
      correlationId,
      duration: timer.elapsed(),
      userId,
      questionId,
      isCorrect
    });

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.answer,
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
