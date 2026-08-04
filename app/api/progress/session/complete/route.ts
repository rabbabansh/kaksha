import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processSessionCompletion } from '@/lib/progress';
import { logger } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const operation = 'progress_session_complete';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId }, { status: 401 });
    }

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID not found', code: ErrorCode.NOT_FOUND, correlationId }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ success: false, error: 'Invalid format', code: ErrorCode.VALIDATION_ERROR, correlationId }, { status: 400 });
    }

    const { subtopics } = body;
    if (!subtopics || !Array.isArray(subtopics)) {
      return NextResponse.json({ success: false, error: 'subtopics array is required', code: ErrorCode.VALIDATION_ERROR, correlationId }, { status: 400 });
    }

    await processSessionCompletion(userId, subtopics);

    logger.info(`${operation} completed successfully`, { correlationId, userId, processedCount: subtopics.length });
    
    return NextResponse.json({ success: true, correlationId });
  } catch (error) {
    logger.error(`${operation} failed`, { correlationId, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId }, { status: 500 });
  }
}
