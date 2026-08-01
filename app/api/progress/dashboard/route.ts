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

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { xp: true, badges: true, targetExamYear: true }
    });

    const progressRecords = await prisma.userProgress.findMany({
      where: { userId }
    });

    const rawAttempts = await prisma.questionAttempt.findMany({
      where: { userId },
      include: {
        question: { select: { section: true, topic: true, subtopic: true } }
      }
    });

    const hierarchy: any = {};
    let totalScoreSum = 0;
    let totalCount = 0;

    // Build baseline hierarchy with all available topics from the DB
    const allTopics = await prisma.questions.findMany({
      select: { section: true, topic: true, subtopic: true },
      distinct: ['section', 'topic', 'subtopic']
    });

    allTopics.forEach(q => {
      const { section, topic, subtopic } = q;
      if (!section || !topic || !subtopic) return;

      if (!hierarchy[section]) {
        hierarchy[section] = { name: section, topics: {} };
      }
      if (!hierarchy[section].topics[topic]) {
        hierarchy[section].topics[topic] = { name: topic, subtopics: {} };
      }
      if (!hierarchy[section].topics[topic].subtopics[subtopic]) {
        hierarchy[section].topics[topic].subtopics[subtopic] = {
          name: subtopic,
          score: 0,
          totalQuestions: 0,
          rawAttempts: 0,
          rawCorrect: 0,
          rawWrong: 0
        };
      }
    });

    // Process raw attempts
    rawAttempts.forEach(attempt => {
      const { section, topic, subtopic } = attempt.question || {};
      if (!section || !topic || !subtopic) return;
      if (hierarchy[section]?.topics[topic]?.subtopics[subtopic]) {
        const node = hierarchy[section].topics[topic].subtopics[subtopic];
        node.rawAttempts += 1;
        if (attempt.isCorrect) node.rawCorrect += 1;
        else node.rawWrong += 1;
      }
    });

    // Overlay user progress
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
        
        section.rawAttempts = (section.rawAttempts || 0) + topic.rawAttempts;
        section.rawCorrect = (section.rawCorrect || 0) + topic.rawCorrect;
        section.rawWrong = (section.rawWrong || 0) + topic.rawWrong;
      });
      
      section.score = secCount > 0 ? Math.round(secSum / secCount) : 0;
    });

    const overallScore = totalCount > 0 ? Math.round(totalScoreSum / totalCount) : 0;
    const stats = await getUserProgressStats(userId);

    // Also update UserProfile with overall score
    await prisma.userProfile.upsert({
      where: { userId },
      update: { kakshaScore: overallScore },
      create: { userId, kakshaScore: overallScore }
    });

    // Fetch Top 5 Leaderboard Users
    const topUsersProfiles = await prisma.userProfile.findMany({
      orderBy: { kakshaScore: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    const leaderboard = await Promise.all(topUsersProfiles.map(async (p, index) => {
      // Find top strength from UserProgress
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

    // Fetch all user scores for the distribution plot and to calculate exact rank
    const allProfiles = await prisma.userProfile.findMany({
      select: { kakshaScore: true, userId: true, user: { select: { name: true, email: true } }, totalAttempts: true, totalCorrect: true }
    });

    // Sort by score descending to find rank
    allProfiles.sort((a, b) => (b.kakshaScore || 0) - (a.kakshaScore || 0));
    
    let userRank = -1;
    let userProfileData: any = null;

    const allUsersDistribution = allProfiles.map((p, index) => {
      if (p.userId === userId) {
        userRank = index + 1;
        userProfileData = p;
      }
      return {
        userId: p.userId,
        name: p.user?.name || p.user?.email?.split('@')[0] || 'Anonymous',
        score: p.kakshaScore || 0,
        isUser: p.userId === userId
      };
    });

    // If the user is not in the top 10, append them to the leaderboard
    if (!leaderboard.some(l => l.isUser) && userProfileData) {
      const userProg = await prisma.userProgress.findMany({
        where: { userId, totalQuestions: { gt: 0 } },
        orderBy: { masteryLevel: 'desc' },
        take: 1
      });
      const topStrength = userProg.length > 0 ? userProg[0].subtopic : 'N/A';
      const acc = userProfileData.totalAttempts > 0 ? Math.round((userProfileData.totalCorrect / userProfileData.totalAttempts) * 100) + '%' : '0%';

      leaderboard.push({
        userId,
        rank: userRank,
        name: userProfileData.user?.name || userProfileData.user?.email?.split('@')[0] || 'Anonymous',
        score: userProfileData.kakshaScore || 0,
        avatar: (userProfileData.user?.name || userProfileData.user?.email || 'A').substring(0, 2).toUpperCase(),
        isUser: true,
        acc,
        strength: topStrength
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overallScore,
        hierarchy,
        strengths: stats.strengths || [],
        weaknesses: stats.weaknesses || [],
        xp: profile?.xp || 0,
        badges: profile?.badges ? JSON.parse(profile.badges) : [],
        targetExamYear: profile?.targetExamYear,
        totalRawAttempts: rawAttempts.length,
        totalRawCorrect: rawAttempts.filter(a => a.isCorrect).length,
        totalRawWrong: rawAttempts.filter(a => !a.isCorrect).length,
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
