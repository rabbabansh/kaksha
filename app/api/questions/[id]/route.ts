import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the full question with all fields
    const question = await prisma.questions.findUnique({
      where: { question_id: id },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // If this question belongs to a set, also fetch all questions in the set
    let setQuestions = null;
    if (question.set_id && question.set_id !== 'N/A') {
      setQuestions = await prisma.questions.findMany({
        where: { set_id: question.set_id },
        orderBy: { question_id: 'asc' },
      });
    }

    return NextResponse.json({
      question,
      setQuestions,
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

