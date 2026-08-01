import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const correlationId = generateCorrelationId();
  try {
    const { userId } = await params;
    
    console.log("PROFILE API - userId from params:", userId);

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, image: true, createdAt: true } }
      }
    });
    
    console.log("PROFILE API - userProfile found:", !!userProfile, "has user:", !!userProfile?.user);

    if (!userProfile || !userProfile.user) {
      return NextResponse.json({ success: false, error: 'User not found', code: ErrorCode.NOT_FOUND, correlationId }, { status: 404 });
    }

    // Get user's progress records to find strengths and weaknesses
    const userProg = await prisma.userProgress.findMany({
      where: { userId, totalQuestions: { gt: 0 } },
      orderBy: { masteryLevel: 'desc' }
    });

    const topStrengths = userProg.slice(0, 3).map(p => p.subtopic);
    const topWeaknesses = userProg.slice(-3).reverse().map(p => p.subtopic);

    const accuracy = userProfile.totalAttempts > 0 
      ? Math.round((userProfile.totalCorrect / userProfile.totalAttempts) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        name: userProfile.user.name || userProfile.user.email?.split('@')[0] || 'Anonymous',
        image: userProfile.user.image,
        joinedAt: userProfile.user.createdAt,
        kakshaScore: userProfile.kakshaScore,
        xp: userProfile.xp,
        totalAttempts: userProfile.totalAttempts,
        totalCorrect: userProfile.totalCorrect,
        accuracy,
        badges: userProfile.badges ? JSON.parse(userProfile.badges) : [],
        topStrengths,
        topWeaknesses,
        targetExamYear: userProfile.targetExamYear
      },
      correlationId
    });

  } catch (error) {
    console.error('Failed to fetch public profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
