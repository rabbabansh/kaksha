import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve userId — NextAuth JWT may not have id in session.user directly
    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, reason, customReason } = body;

    if (!questionId || !reason) {
      return NextResponse.json(
        { error: 'Missing questionId or reason' },
        { status: 400 }
      );
    }

    // Verify the question exists before creating the report
    const questionExists = await prisma.questions.findUnique({
      where: { question_id: questionId },
      select: { question_id: true },
    });

    if (!questionExists) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const report = await prisma.reportedQuestion.create({
      data: {
        userId,
        questionId,
        reason,
        details: customReason?.trim() || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, data: { reportId: report.id } });

  } catch (error) {
    console.error('[Report API] Failed to submit report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

