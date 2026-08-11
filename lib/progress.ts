import prisma from './prisma';

export interface SubtopicProgress {
  section: string;
  topic: string;
  subtopic: string;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
}

export interface TopicProgress {
  section: string;
  topic: string;
  subtopics: SubtopicProgress[];
  percentage: number;
}

export interface SectionProgress {
  section: string;
  topics: TopicProgress[];
  percentage: number;
}

export interface UserProgressStats {
  kakshaScore: number;
  sections: SectionProgress[];
  strengths: string[];
  weaknesses: string[];
  totalAttempts: number;
  totalCorrect: number;
}

/**
 * Calculates new mastery using the Rolling Window approach.
 * Fetches the last 20 attempts for the given user and subtopic.
 */
export async function calculateRollingMastery(userId: string, subtopic: string): Promise<number> {
  const attempts = await prisma.$queryRaw<any[]>`
    SELECT qa."isCorrect" 
    FROM "QuestionAttempt" qa
    JOIN "questions" q ON qa."questionId" = q.question_id
    WHERE qa."userId" = ${userId} 
      AND q.subtopic = ${subtopic}
      AND qa.source IN ('diagnostic', 'practice', 'mock')
    ORDER BY qa."attemptedAt" DESC
    LIMIT 20
  `;
  
  if (!attempts || attempts.length === 0) return 0.0;
  
  const correct = attempts.filter(a => a.isCorrect).length;
  return correct / attempts.length; // 0.0 to 1.0
}

/**
 * Re-evaluates mastery for a specific subtopic and updates the UserProgress table.
 */
export async function recalculateSubtopicProgress(userId: string, subtopic: string) {
  const question = await prisma.questions.findFirst({
    where: { subtopic },
    select: { section: true, topic: true }
  });
  if (!question || !question.section || !question.topic) return;

  const newMasteryLevel = await calculateRollingMastery(userId, subtopic);
  
  const allAttempts = await prisma.$queryRaw<any[]>`
    SELECT CAST(COUNT(DISTINCT qa."questionId") AS INTEGER) as total,
           CAST(COUNT(DISTINCT CASE WHEN qa."isCorrect" THEN qa."questionId" END) AS INTEGER) as correct
    FROM "QuestionAttempt" qa
    JOIN "questions" q ON qa."questionId" = q.question_id
    WHERE qa."userId" = ${userId} AND q.subtopic = ${subtopic}
  `;

  const totalQuestions = Number(allAttempts[0]?.total) || 0;
  const correctCount = Number(allAttempts[0]?.correct) || 0;

  await prisma.userProgress.upsert({
    where: {
      userId_section_topic_subtopic: {
        userId,
        section: question.section,
        topic: question.topic,
        subtopic
      }
    },
    update: {
      masteryLevel: newMasteryLevel,
      totalQuestions,
      correctCount,
      lastAttemptedAt: new Date()
    },
    create: {
      userId,
      section: question.section,
      topic: question.topic,
      subtopic,
      masteryLevel: newMasteryLevel,
      totalQuestions,
      correctCount,
      lastAttemptedAt: new Date()
    }
  });
}

/**
 * Session Complete Recalculation
 * Call this at the end of a module to recalculate only the touched subtopics,
 * then roll up the Kaksha score.
 */
export async function processSessionCompletion(userId: string, touchedSubtopics: string[]) {
  const uniqueSubtopics = Array.from(new Set(touchedSubtopics));
  for (const subtopic of uniqueSubtopics) {
    if (subtopic) {
      await recalculateSubtopicProgress(userId, subtopic);
    }
  }
  await updateUserProfile(userId);
}

/**
 * Compatibility function for chat attempts.
 */
export async function updateUserProgress(userId: string, questionId: string, isCorrect: boolean, source: string = 'chat') {
  if (source === 'chat') {
    const question = await prisma.questions.findUnique({ where: { question_id: questionId }, select: { subtopic: true } });
    if (question?.subtopic) {
      await recalculateSubtopicProgress(userId, question.subtopic);
      await updateUserProfile(userId);
    }
  }
}

/**
 * Main roll-up logic for Kaksha Score that applies the Breadth Penalty
 */
export async function getUserProgressStats(userId: string): Promise<UserProgressStats> {
  const progressRecords = await prisma.userProgress.findMany({
    where: { userId }
  });

  const totalAttempts = await prisma.questionAttempt.count({ where: { userId } });
  const totalCorrect = await prisma.questionAttempt.count({ where: { userId, isCorrect: true } });

  const allSubtopics = await prisma.questions.findMany({
    select: { section: true, topic: true, subtopic: true },
    distinct: ['section', 'topic', 'subtopic']
  });

  const hierarchy: any = {};
  allSubtopics.forEach(q => {
    if (!q.section || !q.topic || !q.subtopic) return;
    if (!hierarchy[q.section]) hierarchy[q.section] = {};
    if (!hierarchy[q.section][q.topic]) hierarchy[q.section][q.topic] = {};
    hierarchy[q.section][q.topic][q.subtopic] = {
      percentage: 0,
      totalQuestions: 0,
      correctCount: 0
    };
  });

  progressRecords.forEach(r => {
    if (hierarchy[r.section]?.[r.topic]?.[r.subtopic]) {
      hierarchy[r.section][r.topic][r.subtopic] = {
        percentage: Math.round(r.masteryLevel * 100),
        totalQuestions: r.totalQuestions,
        correctCount: r.correctCount
      };
    }
  });

  const sections: SectionProgress[] = [];
  let kakshaScoreSum = 0;
  let sectionCount = 0;

  for (const [sectionName, topicsMap] of Object.entries(hierarchy)) {
    const topics: TopicProgress[] = [];
    let sectionScoreSum = 0;
    let topicCount = 0;

    for (const [topicName, subtopicsMap] of Object.entries(topicsMap as any)) {
      const subtopics: SubtopicProgress[] = [];
      let topicScoreSum = 0;
      let subtopicCount = 0;

      for (const [subtopicName, data] of Object.entries(subtopicsMap as any)) {
        const sd = data as any;
        subtopics.push({
          section: sectionName,
          topic: topicName,
          subtopic: subtopicName,
          percentage: sd.percentage,
          totalQuestions: sd.totalQuestions,
          correctCount: sd.correctCount
        });
        topicScoreSum += sd.percentage;
        subtopicCount += 1;
      }

      const topicPercentage = subtopicCount > 0 ? Math.round(topicScoreSum / subtopicCount) : 0;
      
      topics.push({
        section: sectionName,
        topic: topicName,
        subtopics,
        percentage: topicPercentage
      });

      sectionScoreSum += topicPercentage;
      topicCount += 1;
    }

    const sectionPercentage = topicCount > 0 ? Math.round(sectionScoreSum / topicCount) : 0;
    
    sections.push({
      section: sectionName,
      topics,
      percentage: sectionPercentage
    });

    kakshaScoreSum += sectionPercentage;
    sectionCount += 1;
  }

  const kakshaScore = sectionCount > 0 ? Math.round(kakshaScoreSum / sectionCount) : 0;

  const rankedSubtopics = [];
  for (const s of sections) {
    for (const t of s.topics) {
      for (const st of t.subtopics) {
        rankedSubtopics.push({
          key: `${st.section} > ${st.topic} > ${st.subtopic}`,
          percentage: st.percentage,
          hasAttempt: st.totalQuestions > 0
        });
      }
    }
  }

  const sortedSubtopics = [...rankedSubtopics].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return (b.hasAttempt ? 1 : 0) - (a.hasAttempt ? 1 : 0);
  });

  const strengths = sortedSubtopics.slice(0, 3).map(s => s.key);
  const strengthSet = new Set(strengths);
  const weaknesses = [...rankedSubtopics]
    .filter(s => !strengthSet.has(s.key))
    .sort((a, b) => {
      if (a.percentage !== b.percentage) return a.percentage - b.percentage;
      return (b.hasAttempt ? 1 : 0) - (a.hasAttempt ? 1 : 0);
    })
    .slice(0, 3)
    .map(w => w.key);

  return { kakshaScore, sections, strengths, weaknesses, totalAttempts, totalCorrect };
}

export async function updateUserProfile(userId: string): Promise<void> {
  const stats = await getUserProgressStats(userId);
  const xp = (stats.totalCorrect * 10) + ((stats.totalAttempts - stats.totalCorrect) * 2);
  
  const accuracy = stats.totalAttempts > 0 
    ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) 
    : 0;

  const badges: string[] = [];

  // --- Activity Badges ---
  if (stats.totalAttempts >= 1) badges.push('First Step');
  if (stats.totalAttempts >= 10) badges.push('Novice');
  if (stats.totalAttempts >= 50) badges.push('Scholar');
  if (stats.totalAttempts >= 100) badges.push('Veteran');
  if (stats.totalAttempts >= 250) badges.push('Dedicated');
  if (stats.totalAttempts >= 500) badges.push('Legend');

  // --- Accuracy Badges ---
  if (stats.totalAttempts >= 20 && accuracy >= 70) badges.push('Accurate');
  if (stats.totalAttempts >= 20 && accuracy >= 80) badges.push('Sharp Shooter');
  if (stats.totalAttempts >= 20 && accuracy >= 90) badges.push('Sniper');
  if (stats.totalAttempts >= 20 && accuracy >= 95) badges.push('Perfectionist');

  // --- Score / Mastery Badges ---
  if (stats.kakshaScore >= 30) badges.push('Getting There');
  if (stats.kakshaScore >= 50) badges.push('Rising Star');
  if (stats.kakshaScore >= 70) badges.push('Proficient');
  if (stats.kakshaScore >= 80) badges.push('Kaksha Master');
  if (stats.kakshaScore >= 90) badges.push('Elite');
  if (stats.kakshaScore >= 95) badges.push('CAT Conqueror');

  // --- XP Badges ---
  if (xp >= 100) badges.push('XP Earner');
  if (xp >= 500) badges.push('XP Grinder');
  if (xp >= 2000) badges.push('XP Champion');

  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      kakshaScore: stats.kakshaScore,
      totalAttempts: stats.totalAttempts,
      totalCorrect: stats.totalCorrect,
      strengths: JSON.stringify(stats.strengths),
      weaknesses: JSON.stringify(stats.weaknesses),
      xp,
      badges: JSON.stringify(badges),
    },
    create: {
      userId,
      kakshaScore: stats.kakshaScore,
      totalAttempts: stats.totalAttempts,
      totalCorrect: stats.totalCorrect,
      strengths: JSON.stringify(stats.strengths),
      weaknesses: JSON.stringify(stats.weaknesses),
      xp,
      badges: JSON.stringify(badges),
    },
  });
}

