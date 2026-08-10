import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { getAuthenticatedUserId } from '@/lib/services/session-service';

export const dynamic = 'force-dynamic';

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

    // Fetch all question attempts for calendar logic
    const attemptDatesRaw = await prisma.questionAttempt.findMany({
      where: { userId },
      select: { 
        attemptedAt: true,
        isCorrect: true,
        question: { select: { topic: true, subtopic: true } }
      }
    });
    
    // Group by Date string "YYYY-MM-DD"
    const calendarData: Record<string, { total: number, correct: number, topics: string[] }> = {};

    attemptDatesRaw.forEach(attempt => {
      const dateStr = attempt.attemptedAt.toISOString().split('T')[0];
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = { total: 0, correct: 0, topics: [] };
      }
      
      calendarData[dateStr].total += 1;
      if (attempt.isCorrect) calendarData[dateStr].correct += 1;
      
      const topic = attempt.question?.subtopic || attempt.question?.topic;
      if (topic && !calendarData[dateStr].topics.includes(topic)) {
        calendarData[dateStr].topics.push(topic);
      }
    });

    // We can also fetch Sessions (Mock Tests/Practice Modules) that might not have logged individual QuestionAttempts
    const sessionDatesRaw = await prisma.session.findMany({
      where: { userId },
      select: { createdAt: true, type: true, topic: true, subtopic: true }
    });

    sessionDatesRaw.forEach(session => {
      const dateStr = session.createdAt.toISOString().split('T')[0];
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = { total: 0, correct: 0, topics: [] };
      }
      // Assuming a session without question logs is still an "attempt" of some sort
      if (calendarData[dateStr].total === 0) {
        calendarData[dateStr].total += 1; // Mark as active
      }
      
      const topic = session.subtopic || session.topic || session.type;
      if (topic && !calendarData[dateStr].topics.includes(topic)) {
        calendarData[dateStr].topics.push(topic);
      }
    });

    // Format for easier consumption by recharts or heatmap (array format)
    const activeDays = Object.keys(calendarData).map(dateStr => ({
      date: dateStr,
      ...calendarData[dateStr]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        activeDays,
        rawCalendarMap: calendarData
      },
      correlationId
    });

  } catch (error) {
    console.error('Calendar aggregation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
