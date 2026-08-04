import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger, createTimer } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { updateUserProgress } from '@/lib/progress';

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

    const progress = await prisma.session.findFirst({
      where: {
        userId,
        year,
        slot,
        type: 'MOCK',
        completed: false,
      },
      orderBy: { createdAt: 'desc' },
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
        logger.warn(`${operation} user ID not found and no fallback available`, { operation, correlationId });
        return NextResponse.json(
          { success: false, error: 'User ID not found', code: ErrorCode.NOT_FOUND, correlationId },
          { status: 400 }
        );
      }
      userId = dbUser.id;
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
    const { year, slot, answers, flagged, timeRemaining, currentSection, completed, score, timeTakenMap } = body;

    if (!year || !slot) {
      return NextResponse.json(
        { success: false, error: 'Year and slot are required', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    let progress = await prisma.session.findFirst({
      where: {
        userId,
        year,
        slot,
        completed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (progress) {
      progress = await prisma.session.update({
        where: { id: progress.id },
        data: {
          answers: JSON.stringify(answers || {}),
          flagged: JSON.stringify(flagged || []),
          timeRemaining: timeRemaining ?? undefined,
          currentSection: currentSection ?? undefined,
          completed: completed ?? false,
          score: score ?? undefined,
        }
      });
    } else {
      progress = await prisma.session.create({
        data: {
          userId,
          type: 'MOCK',
          year,
          slot,
          answers: JSON.stringify(answers || {}),
          flagged: JSON.stringify(flagged || []),
          timeRemaining: timeRemaining ?? undefined,
          currentSection: currentSection ?? undefined,
          completed: completed ?? false,
          score: score ?? undefined,
        }
      });
    }

    // When a test is submitted as completed, create QuestionAttempt records
    // so that Progress tab and Chat AI have full context of test performance.
    if (completed && answers && typeof answers === 'object') {
      const questionIds = Object.keys(answers);

      if (questionIds.length > 0) {
        // Fetch the correct answers for all submitted questions
        const questionRecords = await prisma.questions.findMany({
          where: { question_id: { in: questionIds } },
          select: { question_id: true, answer: true },
        });

        const correctAnswerMap = new Map(
          questionRecords.map((q) => [q.question_id, q.answer])
        );

        // Create QuestionAttempt records for any question not yet recorded via this test
        const existingAttempts = await prisma.questionAttempt.findMany({
          where: {
            userId,
            questionId: { in: questionIds },
            source: 'test',
          },
          select: { questionId: true },
        });
        const alreadyRecorded = new Set(existingAttempts.map((a) => a.questionId));

        const attemptsToCreate = questionIds
          .filter((qId) => {
            const userAnswer = answers[qId];
            // Only record answered questions not already recorded
            return userAnswer && userAnswer.trim() !== '' && !alreadyRecorded.has(qId);
          })
          .map((qId) => {
            const userAnswer = String(answers[qId]).trim();
            const correctAnswer = (correctAnswerMap.get(qId) || '').trim().toUpperCase();
            const isCorrect = userAnswer.toUpperCase() === correctAnswer;
            const timeTaken = timeTakenMap && timeTakenMap[qId] ? timeTakenMap[qId] : null;
            return {
              userId,
              questionId: qId,
              userAnswer,
              isCorrect,
              timeTaken,
              source: 'test',
            };
          });

        if (attemptsToCreate.length > 0) {
          await prisma.questionAttempt.createMany({ data: attemptsToCreate });

          // Recalculate UserProgress for every question that was answered
          const uniqueQuestionIds = [...new Set(attemptsToCreate.map((a) => a.questionId))];
          await Promise.allSettled(
            uniqueQuestionIds.map((qId) =>
              updateUserProgress(userId, qId, attemptsToCreate.find((a) => a.questionId === qId)!.isCorrect)
            )
          );

          logger.info(`${operation} created ${attemptsToCreate.length} question attempts from test`, {
            operation,
            correlationId,
            userId,
          });
        }
      }
    }

    if (progress.completed) {
        // Fetch test to trigger BKT update
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/progress/process-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({ testProgressId: progress.id })
        }).catch(e => console.error('Failed to trigger BKT processing:', e));

        // If this was the Diagnostic test, complete onboarding and generate AI plan
        if (year === 'Diagnostic') {
            await prisma.userProfile.update({
                where: { userId },
                data: { onboardingCompleted: true }
            });

            // Generate AI Action plan in the background
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/progress/ai-analysis?force=true`, {
                headers: { 'Cookie': request.headers.get('cookie') || '' }
            }).catch(e => console.error('Failed to trigger initial AI Analysis:', e));
        }
    }

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
