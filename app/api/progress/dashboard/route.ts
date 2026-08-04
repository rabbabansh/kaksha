/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { getUserProgressStats } from '@/lib/progress';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    
    if (!userId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      // Fallback for MVP testing if no session
      const dbUser = await prisma.user.findFirst();
      if (!dbUser) {
        return NextResponse.json({ success: false, error: 'No user in DB', code: ErrorCode.NOT_FOUND }, { status: 400 });
      }
      userId = dbUser.id;
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { xp: true, badges: true, targetExamYear: true, kakshaScore: true, totalAttempts: true, totalCorrect: true, user: { select: { name: true, email: true } } }
    });

    const progressRecords = await prisma.userProgress.findMany({
      where: { userId }
    });

    const rawAttemptsAgg = await prisma.$queryRaw<any[]>`
      SELECT q.section, q.topic, q.subtopic, 
             CAST(COUNT(qa.id) AS INTEGER) as "rawAttempts", 
             CAST(SUM(CASE WHEN qa."isCorrect" THEN 1 ELSE 0 END) AS INTEGER) as "rawCorrect"
      FROM "QuestionAttempt" qa
      JOIN "questions" q ON qa."questionId" = q.question_id
      WHERE qa."userId" = ${userId}
      GROUP BY q.section, q.topic, q.subtopic
    `;

    const hierarchy: any = {};
    let totalScoreSum = 0;
    let totalCount = 0;

    const allTopics = await prisma.questions.findMany({
      select: { section: true, topic: true, subtopic: true },
      distinct: ['section', 'topic', 'subtopic']
    });

    allTopics.forEach(q => {
      const { section, topic, subtopic } = q;
      if (!section || !topic || !subtopic) return;

      if (!hierarchy[section]) hierarchy[section] = { name: section, topics: {} };
      if (!hierarchy[section].topics[topic]) hierarchy[section].topics[topic] = { name: topic, subtopics: {} };
      if (!hierarchy[section].topics[topic].subtopics[subtopic]) {
        hierarchy[section].topics[topic].subtopics[subtopic] = {
          name: subtopic, score: 0, totalQuestions: 0, rawAttempts: 0, rawCorrect: 0, rawWrong: 0
        };
      }
    });

    rawAttemptsAgg.forEach(agg => {
      const { section, topic, subtopic, rawAttempts, rawCorrect } = agg;
      if (hierarchy[section]?.topics[topic]?.subtopics[subtopic]) {
        const node = hierarchy[section].topics[topic].subtopics[subtopic];
        node.rawAttempts = Number(rawAttempts) || 0;
        node.rawCorrect = Number(rawCorrect) || 0;
        node.rawWrong = node.rawAttempts - node.rawCorrect;
      }
    });

    progressRecords.forEach(record => {
      const { section, topic, subtopic, masteryLevel } = record;
      const score = Math.round(masteryLevel * 100);

      if (hierarchy[section]?.topics[topic]?.subtopics[subtopic]) {
        hierarchy[section].topics[topic].subtopics[subtopic].score = score;
        hierarchy[section].topics[topic].subtopics[subtopic].totalQuestions = record.totalQuestions;
        totalScoreSum += score;
        totalCount += 1;
      }
    });

    // Roll up averages
    Object.values(hierarchy).forEach((section: any) => {
      let secSum = 0;
      let secCount = 0;
      section.rawAttempts = 0;
      section.rawCorrect = 0;
      section.rawWrong = 0;
      
      Object.values(section.topics).forEach((topic: any) => {
        let topSum = 0;
        let topCount = 0;
        topic.rawAttempts = 0;
        topic.rawCorrect = 0;
        topic.rawWrong = 0;

        Object.values(topic.subtopics).forEach((sub: any) => {
          topSum += sub.score;
          topCount += 1;
          topic.rawAttempts += sub.rawAttempts;
          topic.rawCorrect += sub.rawCorrect;
          topic.rawWrong += sub.rawWrong;
        });
        
        topic.score = topCount > 0 ? Math.round(topSum / topCount) : 0;
        secSum += topic.score;
        secCount += 1;
        
        section.rawAttempts += topic.rawAttempts;
        section.rawCorrect += topic.rawCorrect;
        section.rawWrong += topic.rawWrong;
      });
      
      section.score = secCount > 0 ? Math.round(secSum / secCount) : 0;
    });

    const overallScore = totalCount > 0 ? Math.round(totalScoreSum / totalCount) : 0;
    const stats = await getUserProgressStats(userId);

    await prisma.userProfile.upsert({
      where: { userId },
      update: { kakshaScore: overallScore },
      create: { userId, kakshaScore: overallScore }
    });

    // Leaderboard logic remains the same as it's targeted and takes only top 10
    const topUsersProfiles = await prisma.userProfile.findMany({
      orderBy: { kakshaScore: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    const leaderboard = await Promise.all(topUsersProfiles.map(async (p, index) => {
      const userProg = await prisma.userProgress.findMany({
        where: { userId: p.userId, totalQuestions: { gt: 0 } },
        orderBy: { masteryLevel: 'desc' },
        take: 1
      });
      const topStrength = userProg.length > 0 ? userProg[0].subtopic : 'N/A';
      const acc = p.totalAttempts > 0 ? Math.round((p.totalCorrect / p.totalAttempts) * 100) + '%' : '0%';
      return {
        userId: p.userId,
        rank: index + 1,
        name: p.user?.name || p.user?.email?.split('@')[0] || 'Anonymous',
        score: p.kakshaScore || 0,
        avatar: (p.user?.name || p.user?.email || 'A').substring(0, 2).toUpperCase(),
        isUser: p.userId === userId,
        acc,
        strength: topStrength
      };
    }));

    // Distribution Bin calculation via DB
    const myScore = profile?.kakshaScore || overallScore;
    
    const rawBins = await prisma.$queryRaw<any[]>`
      SELECT 
        CAST(FLOOR("kakshaScore" / 10.0) * 10 AS INTEGER) as bin, 
        CAST(COUNT(*) AS INTEGER) as count
      FROM "UserProfile"
      GROUP BY CAST(FLOOR("kakshaScore" / 10.0) * 10 AS INTEGER)
      ORDER BY bin
    `;
    
    let allUsersDistribution: any[] = [];
    rawBins.forEach(b => {
      const binVal = b.bin || 0;
      for (let i = 0; i < (b.count || 0); i++) {
        allUsersDistribution.push({
           name: 'User',
           score: binVal + Math.floor(Math.random() * 9), 
           isUser: false
        });
      }
    });

    const rankCount = await prisma.userProfile.count({
      where: { kakshaScore: { gt: myScore } }
    });
    const userRank = rankCount + 1;

    allUsersDistribution.push({
      name: profile?.user?.name || 'You',
      score: myScore,
      isUser: true
    });

    if (!leaderboard.some(l => l.isUser) && profile) {
      const userProg = await prisma.userProgress.findMany({
        where: { userId, totalQuestions: { gt: 0 } },
        orderBy: { masteryLevel: 'desc' },
        take: 1
      });
      const topStrength = userProg.length > 0 ? userProg[0].subtopic : 'N/A';
      const acc = profile.totalAttempts > 0 ? Math.round((profile.totalCorrect / profile.totalAttempts) * 100) + '%' : '0%';

      leaderboard.push({
        userId,
        rank: userRank,
        name: 'You',
        score: myScore,
        avatar: 'YO',
        isUser: true,
        acc,
        strength: topStrength
      });
    }

    const diagnosticProgress = await prisma.session.findFirst({
      where: { userId, year: 'Diagnostic', slot: '1', completed: true }
    });
    const diagnosticCompleted = !!diagnosticProgress;

    const totalRawAttempts = rawAttemptsAgg.reduce((acc, curr) => acc + (Number(curr.rawAttempts) || 0), 0);
    const totalRawCorrect = rawAttemptsAgg.reduce((acc, curr) => acc + (Number(curr.rawCorrect) || 0), 0);
    const totalRawWrong = totalRawAttempts - totalRawCorrect;

    return NextResponse.json({
      success: true,
      data: {
        diagnosticCompleted,
        overallScore,
        hierarchy,
        strengths: stats.strengths || [],
        weaknesses: stats.weaknesses || [],
        xp: profile?.xp || 0,
        badges: profile?.badges && typeof profile.badges === 'string' ? JSON.parse(profile.badges) : [],
        targetExamYear: profile?.targetExamYear,
        totalRawAttempts,
        totalRawCorrect,
        totalRawWrong,
        leaderboard,
        allUsersDistribution
      },
      correlationId
    });

  } catch (error) {
    console.error('Dashboard aggregation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
