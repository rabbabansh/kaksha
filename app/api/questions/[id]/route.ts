import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { logger, createTimer } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = generateCorrelationId();
  const timer = createTimer();
  const operation = 'get_question_by_id';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      logger.warn(`${operation} unauthorized access attempt`, { operation, correlationId });
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid question ID', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    const question = await prisma.questions.findUnique({
      where: { question_id: id },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found', code: ErrorCode.NOT_FOUND, correlationId },
        { status: 404 }
      );
    }

    let setQuestions = null;
    if (question.set_id && question.set_id !== 'N/A' && question.set_id.trim() !== '') {
      try {
        setQuestions = await prisma.questions.findMany({
          where: { set_id: question.set_id },
          orderBy: { question_id: 'asc' },
        });

        if (setQuestions.length > 10) {
          logger.warn(`Large set detected (${setQuestions.length} questions), limiting response`, {
            operation, correlationId, setId: question.set_id
          });
          setQuestions = [question];
        }
      } catch (setError) {
        logger.error('Error fetching set questions', {
          operation, correlationId, error: setError instanceof Error ? setError.message : String(setError)
        });
        setQuestions = null;
      }
    }

    logger.info(`${operation} completed successfully`, {
      operation,
      correlationId,
      duration: timer.elapsed(),
      questionId: id
    });

    return NextResponse.json({
      success: true,
      data: {
        question,
        setQuestions: setQuestions && setQuestions.length > 1 ? setQuestions : null,
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

    const errorMessage = process.env.NODE_ENV === 'development'
      ? error instanceof Error ? error.message : 'Failed to fetch question'
      : 'Failed to fetch question';

    return NextResponse.json(
      { success: false, error: errorMessage, code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
