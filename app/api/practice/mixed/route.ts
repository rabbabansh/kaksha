/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getUserProgressStats } from '@/lib/progress';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { logger } from '@/lib/logger';

import { getAuthenticatedUserId } from '@/lib/services/session-service';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const operation = 'generate_mixed_module';

  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or User ID not found', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topicParam = searchParams.get('topic');

    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let selectedQuestions: any[] = [];

    if (topicParam) {
      // topicParam is t.name from the UI — it's a topic (e.g. "DI", "LR", "Algebra")
      // so we query WHERE topic = topicParam, NOT subtopic
      selectedQuestions = await prisma.$queryRaw<any[]>`
        SELECT * FROM "questions"
        WHERE "topic" = ${topicParam}
          AND "question_id" NOT IN (
            SELECT "questionId" FROM "QuestionAttempt" WHERE "userId" = ${userId}
          )
        ORDER BY RANDOM()
        LIMIT 10
      `;

      // Fallback: if topic column doesn't match, try subtopic (backward compat)
      if (selectedQuestions.length === 0) {
        selectedQuestions = await prisma.$queryRaw<any[]>`
          SELECT * FROM "questions"
          WHERE "subtopic" = ${topicParam}
            AND "question_id" NOT IN (
              SELECT "questionId" FROM "QuestionAttempt" WHERE "userId" = ${userId}
            )
          ORDER BY RANDOM()
          LIMIT 10
        `;
      }

      if (selectedQuestions.length < 10) {
        const needed = 10 - selectedQuestions.length;
        const selectedIds = selectedQuestions.map((q: any) => q.question_id);

        const attemptedIds = await prisma.questionAttempt.findMany({
          where: { userId },
          select: { questionId: true },
        });
        const attemptedIdSet = new Set(attemptedIds.map(a => a.questionId));

        // Fill up with already-attempted questions from the same topic (recycled)
        const fallback = await prisma.questions.findMany({
          where: {
            OR: [
              { topic: topicParam },
              { subtopic: topicParam },
            ],
            question_id: { notIn: selectedIds },
          },
          take: needed,
        });
        const filteredFallback = fallback.filter(q => !attemptedIdSet.has(q.question_id) || selectedQuestions.length < 5);
        selectedQuestions.push(...shuffle(filteredFallback));
      }
    } else {
      const stats = await getUserProgressStats(userId);
      const weaknesses = stats.weaknesses || []; 

      let targetSubtopics: string[] = [];
      if (weaknesses.length === 0) {
        const randomSubtopics = await prisma.$queryRaw<{ subtopic: string }[]>`
          SELECT DISTINCT "subtopic" FROM "questions"
          WHERE "subtopic" IS NOT NULL
          ORDER BY RANDOM()
          LIMIT 5
        `;
        targetSubtopics = randomSubtopics.map(s => s.subtopic);
      } else {
        targetSubtopics = weaknesses.map(w => {
          const parts = w.split(' > ');
          return parts[2] || '';
        }).filter(Boolean);
      }

      for (const subtopic of targetSubtopics.slice(0, 5)) {
        const unattemptedModern = await prisma.$queryRaw<any[]>`
          SELECT * FROM "questions"
          WHERE "subtopic" = ${subtopic}
            AND "year" >= '2017'
            AND "question_id" NOT IN (
              SELECT "questionId" FROM "QuestionAttempt" WHERE "userId" = ${userId}
            )
          ORDER BY RANDOM()
          LIMIT 2
        `;
        
        let subSelected = [...unattemptedModern];
        if (subSelected.length < 2) {
          const needed = 2 - subSelected.length;
          const modernIds = subSelected.map(q => q.question_id);
          
          const unattemptedOlder = await prisma.questions.findMany({
            where: {
              subtopic: subtopic,
              question_id: {
                notIn: [
                  ...modernIds,
                  // We need the attemptedIds list for notIn here
                ]
              }
            }
          });
          
          // To safely filter attempted out without complex queryRaw, fetch attemptedIds
          const attemptedIds = await prisma.questionAttempt.findMany({
            where: { userId },
            select: { questionId: true },
          });
          const attemptedIdSet = new Set(attemptedIds.map(a => a.questionId));
          
          const filteredOlder = unattemptedOlder.filter(q => !attemptedIdSet.has(q.question_id));
          subSelected.push(...shuffle(filteredOlder).slice(0, needed));
        }
        
        selectedQuestions.push(...subSelected);
      }

      if (selectedQuestions.length < 10) {
        const needed = 10 - selectedQuestions.length;
        const selectedIds = selectedQuestions.map(q => q.question_id);

        const attemptedIds = await prisma.questionAttempt.findMany({
          where: { userId },
          select: { questionId: true },
        });
        const attemptedIdSet = new Set(attemptedIds.map(a => a.questionId));

        const extraQuestions = await prisma.questions.findMany({
          where: {
            question_id: {
              notIn: [...selectedIds, ...Array.from(attemptedIdSet)]
            }
          },
          take: needed
        });
        selectedQuestions.push(...shuffle(extraQuestions));
      }
    }

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No unattempted questions left.', code: ErrorCode.NOT_FOUND, correlationId },
        { status: 404 }
      );
    }

    const setIdsToFetch = Array.from(new Set(
      selectedQuestions.filter(q => q.set_id && q.set_id !== 'N/A').map(q => q.set_id)
    ));

    if (setIdsToFetch.length > 0) {
      const existingIds = new Set(selectedQuestions.map(q => q.question_id));
      const missingSetQuestions = await prisma.questions.findMany({
        where: {
          set_id: { in: setIdsToFetch as string[] },
          question_id: { notIn: Array.from(existingIds) }
        }
      });
      selectedQuestions.push(...missingSetQuestions);
    }

    const groups: Record<string, any[]> = {};
    for (const q of selectedQuestions) {
      const key = (q.set_id && q.set_id !== 'N/A') ? q.set_id : q.question_id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    }

    const groupKeys = Object.keys(groups);
    const shuffledGroupKeys = shuffle(groupKeys);

    let finalQuestions: any[] = [];
    for (const key of shuffledGroupKeys) {
      finalQuestions.push(...groups[key]);
    }

    logger.info(`${operation} generated mixed module`, {
      correlationId,
      foundCount: finalQuestions.length
    });

    return NextResponse.json({
      success: true,
      data: finalQuestions,
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
