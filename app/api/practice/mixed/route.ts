/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getUserProgressStats } from '@/lib/progress';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const operation = 'generate_mixed_module';

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

    // Check for topic parameter
    const { searchParams } = new URL(request.url);
    const topicParam = searchParams.get('topic');

    // Get IDs of questions already attempted by this user
    const attemptedIds = await prisma.questionAttempt.findMany({
      where: { userId },
      select: { questionId: true },
    });
    const attemptedIdSet = new Set(attemptedIds.map(a => a.questionId));

    // Shuffle array utility
    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    if (topicParam) {
      // Fetch 10 questions under this topic
      // First try unattempted questions
      const unattemptedMatching = await prisma.questions.findMany({
        where: {
          subtopic: topicParam,
          question_id: { notIn: Array.from(attemptedIdSet) }
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
        }
      });

      let selectedQuestions = shuffle(unattemptedMatching).slice(0, 10);

      // Backfill with attempted questions if needed
      if (selectedQuestions.length < 10) {
        const needed = 10 - selectedQuestions.length;
        const selectedIds = new Set(selectedQuestions.map(q => q.question_id));
        const attemptedMatching = await prisma.questions.findMany({
          where: {
            subtopic: topicParam,
            question_id: { 
              in: Array.from(attemptedIdSet),
              notIn: Array.from(selectedIds)
            }
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
          }
        });
        selectedQuestions.push(...shuffle(attemptedMatching).slice(0, needed));
      }

      logger.info(`${operation} generated topic-specific mixed module`, {
        correlationId,
        topic: topicParam,
        foundCount: selectedQuestions.length
      });

      return NextResponse.json({
        success: true,
        data: selectedQuestions,
        correlationId
      });
    }

    // 1. Get user weaknesses
    const stats = await getUserProgressStats(userId);
    const weaknesses = stats.weaknesses || []; // Format: "Section > Topic > Subtopic"

    // If user has no weaknesses (new user), just pick a random set of 5 subtopics
    let targetSubtopics: string[] = [];
    
    if (weaknesses.length === 0) {
      const randomSubtopics = await prisma.questions.findMany({
        select: { subtopic: true },
        distinct: ['subtopic'],
        take: 5
      });
      targetSubtopics = randomSubtopics.map(s => s.subtopic || '').filter(Boolean);
    } else {
      targetSubtopics = weaknesses.map(w => {
        const parts = w.split(' > ');
        return parts[2] || '';
      }).filter(Boolean);
    }

    let selectedQuestions: any[] = [];

    // 2. Fetch 2 unattempted questions from each of the top 5 weaknesses
    for (const subtopic of targetSubtopics.slice(0, 5)) {
      const allMatching = await prisma.questions.findMany({
        where: { subtopic },
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
        }
      });

      const unattempted = allMatching.filter(q => !attemptedIdSet.has(q.question_id));
      
      const modernQuestions = unattempted.filter(q => q.year && parseInt(q.year) >= 2017);
      const olderQuestions = unattempted.filter(q => !q.year || parseInt(q.year) < 2017);

      const shuffledModern = shuffle(modernQuestions);
      const shuffledOlder = shuffle(olderQuestions);

      let subSelected = [];
      if (shuffledModern.length >= 2) {
        subSelected = shuffledModern.slice(0, 2);
      } else {
        subSelected = [...shuffledModern, ...shuffledOlder].slice(0, 2);
      }
      
      selectedQuestions.push(...subSelected);
    }

    // If we didn't get enough questions from weaknesses (e.g. they don't have many weaknesses or they've exhausted those subtopics)
    // we backfill with random unattempted questions
    if (selectedQuestions.length < 10) {
      const needed = 10 - selectedQuestions.length;
      
      const allUnattempted = await prisma.questions.findMany({
        where: {
          question_id: { notIn: Array.from(attemptedIdSet) }
        },
        select: { question_id: true }
      });

      const selectedIds = new Set(selectedQuestions.map(q => q.question_id));
      const validExtrasIds = allUnattempted
        .filter(q => !selectedIds.has(q.question_id))
        .map(q => q.question_id);
      
      const shuffledExtraIds = shuffle(validExtrasIds).slice(0, needed);

      if (shuffledExtraIds.length > 0) {
        const extraQuestions = await prisma.questions.findMany({
          where: { question_id: { in: shuffledExtraIds } },
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
          }
        });
        selectedQuestions.push(...extraQuestions);
      }
    }

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No unattempted questions left in the entire database.', code: ErrorCode.NOT_FOUND, correlationId },
        { status: 404 }
      );
    }

    // Final shuffle to mix all subtopics together for the rapid-fire quiz
    selectedQuestions = shuffle(selectedQuestions);

    logger.info(`${operation} generated mixed module`, {
      correlationId,
      weaknesses: targetSubtopics.slice(0, 5),
      foundCount: selectedQuestions.length
    });

    return NextResponse.json({
      success: true,
      data: selectedQuestions,
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
