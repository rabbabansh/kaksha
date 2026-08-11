import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { getAuthenticatedUserId } from '@/lib/services/session-service';

export const dynamic = 'force-dynamic';

function getDaySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type')?.toUpperCase(); // 'RC' or 'DILR' or undefined
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 1. Fetch available sets
    const rcSets = await prisma.questions.findMany({
      where: {
        section: { contains: 'Verbal', mode: 'insensitive' },
        set_id: { notIn: ['N/A', '', 'null'] },
        set_html: { not: null }
      },
      select: { set_id: true, subtopic: true, topic: true, year: true },
      distinct: ['set_id'],
      orderBy: [{ set_id: 'asc' }, { year: 'desc' }]
    });

    const dilrSets = await prisma.questions.findMany({
      where: {
        section: { contains: 'Data', mode: 'insensitive' },
        set_id: { notIn: ['N/A', '', 'null'] },
        set_html: { not: null }
      },
      select: { set_id: true, subtopic: true, topic: true, year: true },
      distinct: ['set_id'],
      orderBy: [{ set_id: 'asc' }, { year: 'desc' }]
    });

    const seed = getDaySeed(dateStr);

    const todayRcSetMeta = rcSets.length > 0 ? rcSets[seed % rcSets.length] : null;
    const todayDilrSetMeta = dilrSets.length > 0 ? dilrSets[(seed + 13) % dilrSets.length] : null;

    // Check user completion for today's sets
    const userAttemptsToday = await prisma.questionAttempt.findMany({
      where: {
        userId,
        attemptedAt: {
          gte: new Date(new Date(dateStr).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(dateStr).setHours(23, 59, 59, 999))
        }
      },
      select: {
        questionId: true,
        source: true,
        isCorrect: true,
        question: { select: { set_id: true } }
      }
    });

    const isRcCompleted = userAttemptsToday.some(
      a => a.source === 'daily_rc' || (todayRcSetMeta && a.question?.set_id === todayRcSetMeta.set_id)
    );

    const isDilrCompleted = userAttemptsToday.some(
      a => a.source === 'daily_dilr' || (todayDilrSetMeta && a.question?.set_id === todayDilrSetMeta.set_id)
    );

    // If specific set data was requested (for taking the test)
    if (type === 'RC' || type === 'DILR') {
      const activeMeta = type === 'RC' ? todayRcSetMeta : todayDilrSetMeta;
      if (!activeMeta || !activeMeta.set_id) {
        return NextResponse.json(
          { success: false, error: 'No set found for today', code: ErrorCode.NOT_FOUND, correlationId },
          { status: 404 }
        );
      }

      const questionsInSet = await prisma.questions.findMany({
        where: { set_id: activeMeta.set_id },
        select: {
          question_id: true,
          set_id: true,
          set_html: true,
          year: true,
          slot: true,
          section: true,
          topic: true,
          subtopic: true,
          question_html: true,
          question_type: true,
          option_a_html: true,
          option_b_html: true,
          option_c_html: true,
          option_d_html: true,
          option_e_html: true,
          answer: true,
          explanation_html: true
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          type,
          date: dateStr,
          setId: activeMeta.set_id,
          setHtml: questionsInSet[0]?.set_html || '',
          topic: activeMeta.topic || activeMeta.subtopic,
          subtopic: activeMeta.subtopic,
          year: activeMeta.year,
          questions: questionsInSet,
          isCompleted: type === 'RC' ? isRcCompleted : isDilrCompleted
        },
        correlationId
      });
    }

    // Default overview return
    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        dailyRC: {
          setId: todayRcSetMeta?.set_id,
          title: `RC Passage (CAT ${todayRcSetMeta?.year || 'PYQ'})`,
          subtopic: todayRcSetMeta?.subtopic || 'Reading Comprehension',
          completed: isRcCompleted
        },
        dailyDILR: {
          setId: todayDilrSetMeta?.set_id,
          title: `DILR: ${todayDilrSetMeta?.subtopic || todayDilrSetMeta?.topic} (CAT ${todayDilrSetMeta?.year || 'PYQ'})`,
          subtopic: todayDilrSetMeta?.subtopic || 'Logical Reasoning',
          completed: isDilrCompleted
        }
      },
      correlationId
    });

  } catch (error) {
    console.error('Daily Set API failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
