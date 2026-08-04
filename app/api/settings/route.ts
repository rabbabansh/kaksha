/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true }
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, name, age, targetExamYear } = body;

  if (action === 'update_profile') {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { name }
    });

    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { age, targetExamYear }
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'retake_diagnostic') {
    // Delete previous diagnostic test progress and diagnostic attempts so they start fresh
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        year: 'Diagnostic',
      }
    });

    await prisma.questionAttempt.deleteMany({
      where: {
        userId: user.id,
        source: 'diagnostic'
      }
    });

    // Just flip the flag so they are forced into onboarding again
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { onboardingCompleted: false }
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'reset_progress') {
    // Delete all progress data
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.questionAttempt.deleteMany({ where: { userId: user.id } });
    await prisma.userProgress.deleteMany({ where: { userId: user.id } });
    
    // Reset profile stats
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        kakshaScore: 0,
        totalAttempts: 0,
        totalCorrect: 0,
        xp: 0,
        badges: '[]',
        aiActionPlan: null,
        onboardingCompleted: false
      }
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}
