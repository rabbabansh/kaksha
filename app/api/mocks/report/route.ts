import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

import { getAuthenticatedUserId } from '@/lib/services/session-service';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or User ID not found', code: ErrorCode.UNAUTHORIZED }, { status: 401 });
    }


    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const slot = searchParams.get('slot');

    if (!year || !slot) {
      return NextResponse.json({ success: false, error: 'Year and slot are required' }, { status: 400 });
    }

    // Fetch TestProgress
    const testProgress = await prisma.session.findFirst({
      where: {
        userId,
        year,
        slot,
        type: 'MOCK'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!testProgress) {
      return NextResponse.json({ success: false, error: 'Mock attempt not found' }, { status: 404 });
    }

    // Fetch all questions for this mock
    const questions = await prisma.questions.findMany({
      where: { year, slot }
    });

    const userAnswers = JSON.parse(testProgress.answers || '{}');
    
    // Calculate performance
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let totalScore = 0;
    
    const breakdown: Record<string, { correct: number, incorrect: number, skipped: number, score: number }> = {
      'VARC': { correct: 0, incorrect: 0, skipped: 0, score: 0 },
      'DILR': { correct: 0, incorrect: 0, skipped: 0, score: 0 },
      'QA': { correct: 0, incorrect: 0, skipped: 0, score: 0 },
    };

    const sectionMapping: Record<string, string> = {
      'Verbal Ability & Reading Comprehension': 'VARC',
      'Data Interpretation & Logical Reasoning': 'DILR',
      'Quantitative Ability': 'QA'
    };

    questions.forEach(q => {
      const uAns = userAnswers[q.question_id];
      const sec = sectionMapping[q.section || ''] || 'QA';
      
      if (!uAns) {
        skipped++;
        if (breakdown[sec]) breakdown[sec].skipped++;
      } else if (uAns === q.answer) {
        correct++;
        totalScore += 3;
        if (breakdown[sec]) { breakdown[sec].correct++; breakdown[sec].score += 3; }
      } else {
        incorrect++;
        totalScore -= 1;
        if (breakdown[sec]) { breakdown[sec].incorrect++; breakdown[sec].score -= 1; }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        testProgress,
        stats: { correct, incorrect, skipped, totalScore, breakdown },
        questions,
        userAnswers,
        aiInsights: null // We will add an endpoint to generate this
      },
      correlationId
    });

  } catch (error) {
    console.error('Mock Report fetch failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
