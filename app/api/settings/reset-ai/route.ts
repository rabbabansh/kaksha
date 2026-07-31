import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { getUserProgressStats } from '@/lib/progress';

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED }, { status: 401 });
    }

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID not found', code: ErrorCode.NOT_FOUND }, { status: 400 });
    }

    // Reset AI specific fields, but preserve actual attempts
    await prisma.userProfile.update({
      where: { userId },
      data: {
        strengths: "[]",
        weaknesses: "[]",
        aiActionPlan: null
      }
    });

    // Automatically recalculate based purely on empirical data
    const stats = await getUserProgressStats(userId);
    
    await prisma.userProfile.update({
      where: { userId },
      data: {
        strengths: JSON.stringify(stats.strengths),
        weaknesses: JSON.stringify(stats.weaknesses),
      }
    });

    return NextResponse.json({
      success: true,
      data: { message: "AI Engine successfully reset and recalibrated with empirical data." },
      correlationId
    });

  } catch (error) {
    console.error('Reset AI failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
