import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchQuestionsBySubtopic } from '@/lib/embeddings';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const topic = searchParams.get('topic');
    const subtopic = searchParams.get('subtopic');
    const excludeIdsParam = searchParams.get('excludeIds');
    const limitParam = searchParams.get('limit');

    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!subtopic && !topic && !section) {
      return NextResponse.json(
        { error: 'At least one of section, topic, or subtopic is required' },
        { status: 400 }
      );
    }

    // Use embeddings to search if subtopic is provided
    if (subtopic) {
      const questions = await searchQuestionsBySubtopic(
        subtopic,
        section || undefined,
        topic || undefined,
        excludeIds,
        limit
      );

      return NextResponse.json(questions);
    }

    // Fallback to database query for topic/section only
    const where: any = {};
    if (section) where.section = section;
    if (topic) where.topic = topic;
    if (excludeIds.length > 0) {
      where.question_id = { notIn: excludeIds };
    }

    const questions = await prisma.questions.findMany({
      where,
      take: limit,
    });

    // Shuffle to randomize
    const shuffled = questions.sort(() => Math.random() - 0.5);

    return NextResponse.json(shuffled);
  } catch (error) {
    console.error('Error searching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


