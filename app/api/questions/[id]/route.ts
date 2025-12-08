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

    // Validate question ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    // Fetch the full question with all fields
    const question = await prisma.questions.findUnique({
      where: { question_id: id },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // If this question belongs to a set, also fetch all questions in the set
    // Note: This could be large, but sets are typically small (2-5 questions)
    let setQuestions = null;
    if (question.set_id && question.set_id !== 'N/A' && question.set_id.trim() !== '') {
      try {
        setQuestions = await prisma.questions.findMany({
          where: { set_id: question.set_id },
          orderBy: { question_id: 'asc' },
        });
        
        // Safety check: if set is too large, only return the first question
        // This prevents exceeding response size limits
        if (setQuestions.length > 10) {
          console.warn(`Large set detected (${setQuestions.length} questions), limiting response`);
          setQuestions = [question];
        }
      } catch (setError) {
        console.error('Error fetching set questions:', setError);
        // Continue without set questions if there's an error
        setQuestions = null;
      }
    }

    return NextResponse.json({
      question,
      setQuestions: setQuestions && setQuestions.length > 1 ? setQuestions : null,
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    
    // Provide more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Failed to fetch question'
      : 'Failed to fetch question';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

