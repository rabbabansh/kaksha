import prisma from './prisma';
import { calculateNewMastery, shouldUpdateMastery } from './mastery';

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
  strengths: string[]; // Top 3 subtopics
  weaknesses: string[]; // Bottom 3 subtopics
  totalAttempts: number;
  totalCorrect: number;
}

/**
 * Calculate progress percentage for a subtopic
 */
export function calculateSubtopicPercentage(
  correctCount: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

/**
 * Calculate topic percentage (average of subtopic percentages)
 */
export function calculateTopicPercentage(
  subtopics: SubtopicProgress[]
): number {
  if (subtopics.length === 0) return 0;
  const sum = subtopics.reduce((acc, st) => acc + st.percentage, 0);
  return Math.round(sum / subtopics.length);
}

/**
 * Calculate section percentage (average of topic percentages)
 */
export function calculateSectionPercentage(
  topics: TopicProgress[]
): number {
  if (topics.length === 0) return 0;
  const sum = topics.reduce((acc, t) => acc + t.percentage, 0);
  return Math.round(sum / topics.length);
}

/**
 * Calculate Kaksha score (weighted average across all sections)
 * For CAT: VARC, DILR, QA are equally weighted
 */
export function calculateKakshaScore(
  sections: SectionProgress[]
): number {
  if (sections.length === 0) return 0;
  const sum = sections.reduce((acc, s) => acc + s.percentage, 0);
  return Math.round(sum / sections.length);
}

/**
 * Get all user progress stats
 */
export async function getUserProgressStats(
  userId: string
): Promise<UserProgressStats> {
  // Get all user progress records
  const progressRecords = await prisma.userProgress.findMany({
    where: { userId },
    orderBy: [
      { section: 'asc' },
      { topic: 'asc' },
      { subtopic: 'asc' },
    ],
  });

  // Get total attempts
  const totalAttempts = await prisma.questionAttempt.count({
    where: { userId },
  });

  const totalCorrect = await prisma.questionAttempt.count({
    where: { userId, isCorrect: true },
  });

  // Group by section -> topic -> subtopic
  const sectionsMap = new Map<string, Map<string, SubtopicProgress[]>>();

  progressRecords.forEach((record) => {
    if (!sectionsMap.has(record.section)) {
      sectionsMap.set(record.section, new Map());
    }
    const topicsMap = sectionsMap.get(record.section)!;

    if (!topicsMap.has(record.topic)) {
      topicsMap.set(record.topic, []);
    }

    const subtopic: SubtopicProgress = {
      section: record.section,
      topic: record.topic,
      subtopic: record.subtopic,
      totalQuestions: record.totalQuestions,
      correctCount: record.correctCount,
      percentage: Math.round(record.masteryLevel * 100),
    };

    topicsMap.get(record.topic)!.push(subtopic);
  });

  // Build section progress structure
  const sections: SectionProgress[] = Array.from(sectionsMap.entries()).map(
    ([section, topicsMap]) => {
      const topics: TopicProgress[] = Array.from(topicsMap.entries()).map(
        ([topic, subtopics]) => ({
          section,
          topic,
          subtopics,
          percentage: calculateTopicPercentage(subtopics),
        })
      );

      return {
        section,
        topics,
        percentage: calculateSectionPercentage(topics),
      };
    }
  );

  // Calculate Kaksha score
  const kakshaScore = calculateKakshaScore(sections);

  // Get self-attested strengths/weaknesses from profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { selfStrengths: true, selfWeaknesses: true },
  });
  const selfStrengths = JSON.parse(profile?.selfStrengths || '[]');
  const selfWeaknesses = JSON.parse(profile?.selfWeaknesses || '[]');

  // Get all possible subtopics from DB to seed unattempted slots
  const allPossibleSubtopics = await prisma.questions.findMany({
    select: {
      section: true,
      topic: true,
      subtopic: true,
    },
    distinct: ['section', 'topic', 'subtopic'],
  });

  const progressMap = new Map(progressRecords.map(r => [`${r.section} > ${r.topic} > ${r.subtopic}`, r]));

  // Helper to map subtopics to onboarding self-selections
  const getOnboardingTopic = (section: string, topic: string, subtopic: string): string => {
    if (section === 'Quantitative Ability') {
      if (topic === 'Algebra') {
        if (subtopic === 'Number System' || subtopic === 'Number Theory') {
          return 'Number System';
        }
        return 'Algebra';
      }
      if (topic === 'Arithmetic') return 'Arithmetic';
      if (topic === 'Geometry') return 'Geometry';
      if (topic === 'Modern Math') return 'Modern Math';
      return topic;
    }
    if (section === 'Data Interpretation & Logical Reasoning') {
      if (topic === 'DI') return 'Data Interpretation';
      if (topic === 'LR') return 'Logical Reasoning';
      return topic === 'Venn Diagram' ? 'Data Interpretation' : topic;
    }
    if (section === 'Verbal Ability & Reading Comprehension') {
      if (topic === 'Reading Comprehension') return 'Reading Comprehension';
      return 'Verbal Ability';
    }
    return topic;
  };

  const rankedSubtopics = allPossibleSubtopics.map((s) => {
    const key = `${s.section} > ${s.topic} > ${s.subtopic}`;
    const record = progressMap.get(key);
    
    let percentage = 50; // default neutral
    let hasAttempt = false;

    if (record && record.totalQuestions > 0) {
      percentage = Math.round(record.masteryLevel * 100);
      hasAttempt = true;
    } else {
      // Unattempted subtopics are kept at 50%
      percentage = 50;
    }

    return { key, percentage, hasAttempt };
  });

  // Sort: highest percentage first
  const sortedSubtopics = [...rankedSubtopics].sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return (b.hasAttempt ? 1 : 0) - (a.hasAttempt ? 1 : 0);
  });

  const strengths = sortedSubtopics
    .slice(0, 3)
    .map((s) => s.key);

  const strengthSet = new Set(strengths);

  // Sort for weaknesses: lowest percentage first
  const sortedForWeaknesses = [...rankedSubtopics]
    .filter(s => !strengthSet.has(s.key))
    .sort((a, b) => {
      if (a.percentage !== b.percentage) {
        return a.percentage - b.percentage;
      }
      return (b.hasAttempt ? 1 : 0) - (a.hasAttempt ? 1 : 0);
    });

  const weaknesses = sortedForWeaknesses
    .slice(0, 3)
    .map((w) => w.key);

  return {
    kakshaScore,
    sections,
    strengths,
    weaknesses,
    totalAttempts,
    totalCorrect,
  };
}

/**
 * Update or create user progress for a subtopic
 */
export async function updateUserProgress(
  userId: string,
  questionId: string,
  isCorrect: boolean,
  source: string = 'chat'
): Promise<void> {
  // Get question details
  const question = await prisma.questions.findUnique({
    where: { question_id: questionId },
    select: {
      section: true,
      topic: true,
      subtopic: true,
    },
  });

  if (!question || !question.section || !question.topic || !question.subtopic) {
    return;
  }

  // Get or create progress record
  const existing = await prisma.userProgress.findUnique({
    where: {
      userId_section_topic_subtopic: {
        userId,
        section: question.section,
        topic: question.topic,
        subtopic: question.subtopic,
      },
    },
  });

    // Get all question IDs in this subtopic
    const allQuestionsInSubtopic = await prisma.questions.findMany({
      where: {
        section: question.section,
        topic: question.topic,
        subtopic: question.subtopic,
      },
      select: {
        question_id: true,
      },
    });

    const questionIdsInSubtopic = allQuestionsInSubtopic.map((q) => q.question_id);

    // Count unique questions attempted in this subtopic
    const attemptsInSubtopic = await prisma.questionAttempt.findMany({
      where: {
        userId,
        questionId: { in: questionIdsInSubtopic },
      },
      select: {
        questionId: true,
        isCorrect: true,
      },
    });

    const uniqueQuestionIds = [...new Set(attemptsInSubtopic.map((a) => a.questionId))];
    const questionsWithCorrectIds = [
      ...new Set(
        attemptsInSubtopic.filter((a) => a.isCorrect).map((a) => a.questionId)
      ),
    ];

    // Calculate Mastery
    let newMasteryLevel = existing ? existing.masteryLevel : 0.0;
    if (shouldUpdateMastery(source)) {
      newMasteryLevel = calculateNewMastery(newMasteryLevel, isCorrect);
    }

    if (existing) {
      // Update with recalculated counts
      await prisma.userProgress.update({
        where: { id: existing.id },
        data: {
          totalQuestions: uniqueQuestionIds.length,
          correctCount: questionsWithCorrectIds.length,
          masteryLevel: newMasteryLevel,
          lastAttemptedAt: new Date(),
        },
      });
    } else {
      // Create new progress record
      await prisma.userProgress.create({
        data: {
          userId,
          section: question.section,
          topic: question.topic,
          subtopic: question.subtopic,
          totalQuestions: uniqueQuestionIds.length,
          correctCount: questionsWithCorrectIds.length,
          masteryLevel: newMasteryLevel,
          lastAttemptedAt: new Date(),
        },
      });
    }

  // Update user profile
  await updateUserProfile(userId);
}

/**
 * Update user profile with overall stats
 */
async function updateUserProfile(userId: string): Promise<void> {
  const stats = await getUserProgressStats(userId);

  const xp = (stats.totalCorrect * 10) + ((stats.totalAttempts - stats.totalCorrect) * 2);
  
  const badges = [];
  if (stats.totalAttempts >= 10) badges.push('Novice');
  if (stats.totalAttempts >= 50) badges.push('Scholar');
  if (stats.totalAttempts >= 100) badges.push('Veteran');
  if (stats.kakshaScore >= 50) badges.push('Rising Star');
  if (stats.kakshaScore >= 80) badges.push('Kaksha Master');
  if (stats.kakshaScore >= 95) badges.push('CAT Conqueror');

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

