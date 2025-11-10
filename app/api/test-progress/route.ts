import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const slot = searchParams.get('slot');

    if (!year || !slot) {
      return NextResponse.json({ error: 'Year and slot are required' }, { status: 400 });
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

    const progress = await prisma.testProgress.findUnique({
      where: {
        userId_year_slot: {
          userId,
          year,
          slot,
        },
      },
    });

    if (!progress) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      ...progress,
      answers: JSON.parse(progress.answers),
      flagged: JSON.parse(progress.flagged),
    });
  } catch (error) {
    console.error('Error fetching test progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    const { year, slot, answers, flagged, timeRemaining, currentSection, completed, score } = body;

    if (!year || !slot) {
      return NextResponse.json({ error: 'Year and slot are required' }, { status: 400 });
    }

    const progress = await prisma.testProgress.upsert({
      where: {
        userId_year_slot: {
          userId,
          year,
          slot,
        },
      },
      update: {
        answers: JSON.stringify(answers || {}),
        flagged: JSON.stringify(flagged || []),
        timeRemaining: timeRemaining ?? undefined,
        currentSection: currentSection ?? undefined,
        completed: completed ?? false,
        score: score ?? undefined,
      },
      create: {
        userId,
        year,
        slot,
        answers: JSON.stringify(answers || {}),
        flagged: JSON.stringify(flagged || []),
        timeRemaining: timeRemaining ?? undefined,
        currentSection: currentSection ?? undefined,
        completed: completed ?? false,
        score: score ?? undefined,
      },
    });

    return NextResponse.json({
      ...progress,
      answers: JSON.parse(progress.answers),
      flagged: JSON.parse(progress.flagged),
    });
  } catch (error) {
    console.error('Error saving test progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


