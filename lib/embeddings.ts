import prisma from './prisma';
import { embed } from './embeddingClient';
import type { questions } from './generated/prisma';

type Question = questions;

/**
 * Search questions using vector similarity search
 */
export async function searchQuestionsBySubtopic(
  subtopic: string,
  section?: string,
  topic?: string,
  excludeIds: string[] = [],
  limit: number = 10
): Promise<Question[]> {
  try {
    // 1. Embed the user's query (using the SAME model)
    const queryText = [subtopic, topic, section].filter(Boolean).join(' ');
    const queryVector = await embed(queryText);
    const vectorString = `[${queryVector.join(',')}]`;

    const k = limit + excludeIds.length; // Get more to account for exclusions

    // 2. Perform the vector search (cosine distance)
    // We MUST use $queryRaw for the '<=>' operator
    const searchResults = await prisma.$queryRaw<Array<{ questionId: string }>>`
      SELECT "questionId"
      FROM "QuestionVector"
      ORDER BY vector <=> ${vectorString}::vector
      LIMIT ${k}
    `;

    // 3. "Hydrate" the results (get the full data)
    const resultIds = searchResults
      .map((r) => r.questionId)
      .filter((id) => !excludeIds.includes(id))
      .slice(0, limit);

    if (resultIds.length === 0) {
      return [];
    }

    const contextDocuments = await prisma.questions.findMany({
      where: {
        question_id: { in: resultIds },
      },
    });

    // 4. Maintain order from search results
    const orderedQuestions = resultIds
      .map((id: string) => contextDocuments.find((q) => q.question_id === id))
      .filter(Boolean) as Question[];

    return orderedQuestions;
  } catch (error) {
    console.error('Error in vector search:', error);
    // Fallback to database query
    return searchQuestionsBySubtopicFallback(
      subtopic,
      section,
      topic,
      excludeIds,
      limit
    );
  }
}

/**
 * Fallback search using database (when embeddings fail)
 */
async function searchQuestionsBySubtopicFallback(
  subtopic: string,
  section?: string,
  topic?: string,
  excludeIds: string[] = [],
  limit: number = 10
): Promise<Question[]> {
  const where: {
    subtopic?: string;
    topic?: string;
    section?: string;
    question_id?: { notIn: string[] };
  } = {};
  if (subtopic) where.subtopic = subtopic;
  if (topic) where.topic = topic;
  if (section) where.section = section;
  if (excludeIds.length > 0) {
    where.question_id = { notIn: excludeIds };
  }

  const questions = await prisma.questions.findMany({
    where,
    take: limit,
  });

  // Shuffle to randomize
  return questions.sort(() => Math.random() - 0.5);
}

/**
 * Get question metadata (topics/subtopics counts) for AI context
 */
export async function getQuestionMetadata(): Promise<{
  sections: Record<
    string,
    {
      topics: Record<
        string,
        {
          subtopics: string[];
          count: number;
        }
      >;
    }
  >;
}> {
  const questions = await prisma.questions.findMany({
    select: {
      section: true,
      topic: true,
      subtopic: true,
    },
  });

  const metadata: Record<string, {
    topics: Record<string, {
      subtopics: string[];
      count: number;
    }>;
  }> = {};

  questions.forEach((q) => {
    if (!q.section || !q.topic || !q.subtopic) return;

    if (!metadata[q.section]) {
      metadata[q.section] = { topics: {} };
    }

    if (!metadata[q.section].topics[q.topic]) {
      metadata[q.section].topics[q.topic] = {
        subtopics: [],
        count: 0,
      };
    }

    if (!metadata[q.section].topics[q.topic].subtopics.includes(q.subtopic)) {
      metadata[q.section].topics[q.topic].subtopics.push(q.subtopic);
    }

    metadata[q.section].topics[q.topic].count++;
  });

  return { sections: metadata };
}

