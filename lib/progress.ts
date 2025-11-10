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
      percentage: calculateSubtopicPercentage(
        record.correctCount,
        record.totalQuestions
      ),
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

  // Identify strengths and weaknesses
  const allSubtopics = progressRecords
    .map((r) => ({
      key: `${r.section} > ${r.topic} > ${r.subtopic}`,
      percentage: calculateSubtopicPercentage(
        r.correctCount,
        r.totalQuestions
      ),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const strengths = allSubtopics
    .slice(0, 3)
    .filter((s) => s.percentage > 0)
    .map((s) => s.key);

  const weaknesses = allSubtopics
    .slice(-3)
    .reverse()
    .filter((w) => w.percentage < 100)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _isCorrect: boolean
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

    if (existing) {
      // Update with recalculated counts
      await prisma.userProgress.update({
        where: { id: existing.id },
        data: {
          totalQuestions: uniqueQuestionIds.length,
          correctCount: questionsWithCorrectIds.length,
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

  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      kakshaScore: stats.kakshaScore,
      totalAttempts: stats.totalAttempts,
      totalCorrect: stats.totalCorrect,
      strengths: JSON.stringify(stats.strengths),
      weaknesses: JSON.stringify(stats.weaknesses),
    },
    create: {
      userId,
      kakshaScore: stats.kakshaScore,
      totalAttempts: stats.totalAttempts,
      totalCorrect: stats.totalCorrect,
      strengths: JSON.stringify(stats.strengths),
      weaknesses: JSON.stringify(stats.weaknesses),
    },
  });
}

