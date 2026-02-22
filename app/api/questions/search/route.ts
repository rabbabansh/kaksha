import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchQuestionsBySubtopic } from '@/lib/embeddings';
import prisma from '@/lib/prisma';
import { logger, createTimer } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const timer = createTimer();
  const operation = 'search_questions';

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
    const section = searchParams.get('section');
    const topic = searchParams.get('topic');
    const subtopic = searchParams.get('subtopic');
    const excludeIdsParam = searchParams.get('excludeIds');
    const limitParam = searchParams.get('limit');

    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!subtopic && !topic && !section) {
      return NextResponse.json(
        { success: false, error: 'At least one of section, topic, or subtopic is required', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    if (subtopic) {
      const questions = await searchQuestionsBySubtopic(
        subtopic,
        section || undefined,
        topic || undefined,
        excludeIds,
        limit
      );

      logger.info(`${operation} completed via embeddings`, {
        operation, correlationId, duration: timer.elapsed(), count: questions.length
      });
      return NextResponse.json({ success: true, data: questions, correlationId });
    }

    const where: {
      section?: string;
      topic?: string;
      question_id?: { notIn: string[] };
    } = {};

    if (section) where.section = section;
    if (topic) where.topic = topic;
    if (excludeIds.length > 0) {
      where.question_id = { notIn: excludeIds };
    }

    const questions = await prisma.questions.findMany({
      where,
      take: limit,
    });

    const shuffled = questions.sort(() => Math.random() - 0.5);

    logger.info(`${operation} completed via db query`, {
      operation, correlationId, duration: timer.elapsed(), count: shuffled.length
    });
    return NextResponse.json({ success: true, data: shuffled, correlationId });
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

