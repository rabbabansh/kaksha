/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const operation = 'generate_practice_module';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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
      return NextResponse.json(
        { success: false, error: 'User ID not found', code: ErrorCode.NOT_FOUND, correlationId },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subtopic = searchParams.get('subtopic');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!subtopic) {
      return NextResponse.json(
        { success: false, error: 'subtopic is required', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    // Get IDs of questions already attempted by this user
    const attemptedIds = await prisma.questionAttempt.findMany({
      where: { userId },
      select: { questionId: true },
    });
    const attemptedIdSet = new Set(attemptedIds.map(a => a.questionId));

    // Fetch pool of relevant questions, prioritizing newer years (2017+)
    const allMatching = await prisma.questions.findMany({
      where: { 
        subtopic,
        // Optional: filter out questions that are known to be incomplete or malformed if necessary
      },
      select: {
        question_id: true,
        year: true,
        question_html: true,
        option_a_html: true,
        option_b_html: true,
        option_c_html: true,
        option_d_html: true,
        option_e_html: true,
        question_type: true,
        subtopic: true,
        answer: true,
        explanation_html: true
      },
      // Sorting desc by year to prefer newer ones
      orderBy: { year: 'desc' }
    });

    // Filter out attempted questions
    const unattempted = allMatching.filter(q => !attemptedIdSet.has(q.question_id));

    // We prefer questions from 2017 onwards
    const modernQuestions = unattempted.filter(q => q.year && parseInt(q.year) >= 2017);
    const olderQuestions = unattempted.filter(q => !q.year || parseInt(q.year) < 2017);

    // Shuffle array utility
    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Build the final curated set
    // We want a mix: 70% modern (2017+), 30% older.
    // If one pool runs out, we fill from the other.
    let selected: any[] = [];
    const shuffledModern = shuffle(modernQuestions);
    const shuffledOlder = shuffle(olderQuestions);

    const modernLimit = Math.floor(limit * 0.7);
    const olderLimit = limit - modernLimit;

    const selectedModern = shuffledModern.slice(0, modernLimit);
    const selectedOlder = shuffledOlder.slice(0, olderLimit);

    selected = [...selectedModern, ...selectedOlder];

    // If we didn't hit the total limit (e.g. not enough older questions), 
    // backfill with whatever is left from either pool
    if (selected.length < limit) {
      const remainingNeeded = limit - selected.length;
      const unusedModern = shuffledModern.slice(modernLimit);
      const unusedOlder = shuffledOlder.slice(olderLimit);
      
      const backfill = [...unusedModern, ...unusedOlder].slice(0, remainingNeeded);
      selected = [...selected, ...backfill];
    }
    
    // Final shuffle to mix modern and older questions seamlessly
    selected = shuffle(selected);

    if (selected.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No unattempted questions left for this subtopic.', code: ErrorCode.NOT_FOUND, correlationId },
        { status: 404 }
      );
    }

    logger.info(`${operation} generated targeted set`, {
      correlationId,
      subtopic,
      foundCount: selected.length
    });

    return NextResponse.json({
      success: true,
      data: selected,
      correlationId
    });

  } catch (error) {
    logger.error(`${operation} failed`, {
      correlationId,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
