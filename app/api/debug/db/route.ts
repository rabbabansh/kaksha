import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const dbUser = await prisma.user.findFirst({ orderBy: { questionAttempts: { _count: 'desc' } } });
    if (!dbUser) return NextResponse.json({ error: 'No user' });

    const sessions = await prisma.session.findMany({
      where: { userId: dbUser.id }
    });
    
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId: dbUser.id },
      take: 10
    });

    return NextResponse.json({
      sessionsCount: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id, type: s.type, year: s.year, slot: s.slot, subtopic: s.subtopic, updatedAt: s.updatedAt, score: s.score
      })),
      attemptsCount: attempts.length,
      attempts
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
