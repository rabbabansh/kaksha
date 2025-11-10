import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateUserProgress } from '@/lib/progress';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      // Fallback: fetch user by email
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) {
        userId = dbUser.id;
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const body = await request.json();
    const { questionId, userAnswer, source = 'chat' } = body;

    if (!questionId || !userAnswer) {
      return NextResponse.json(
        { error: 'questionId and userAnswer are required' },
        { status: 400 }
      );
    }

    // Get question to verify answer
    const question = await prisma.questions.findUnique({
      where: { question_id: questionId },
      select: { answer: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect =
      question.answer?.trim().toUpperCase() === userAnswer.trim().toUpperCase();

    // Record attempt
    await prisma.questionAttempt.create({
      data: {
        userId,
        questionId,
        userAnswer,
        isCorrect,
        source,
      },
    });

    // Update progress
    await updateUserProgress(userId, questionId, isCorrect);

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer: question.answer,
    });
  } catch (error) {
    console.error('Error recording attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


