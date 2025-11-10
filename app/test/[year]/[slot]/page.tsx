import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { TestPageClient } from '@/components/test-page-client';
import { TestExploreClient } from '@/components/test-explore-client';

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string; slot: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const { year, slot } = await params;
  const { mode } = await searchParams;
  const userId = (session.user as { id?: string })?.id;

  // Fetch questions for this test
  const questions = await prisma.questions.findMany({
    where: {
      year,
      slot,
    },
    orderBy: [
      { section: 'asc' },
      { question_id: 'asc' },
    ],
  });

  // Group questions by section
  const questionsBySection: Record<string, typeof questions> = {};
  questions.forEach(q => {
    const section = q.section || 'Unknown';
    if (!questionsBySection[section]) {
      questionsBySection[section] = [];
    }
    questionsBySection[section].push(q);
  });

  const sections = Object.keys(questionsBySection).filter(s => s !== 'Unknown');

  // If explore mode, show explore view
  if (mode === 'explore') {
    return (
      <TestExploreClient
        year={year}
        slot={slot}
        questions={questions}
        questionsBySection={questionsBySection}
        sections={sections}
      />
    );
  }

  // Otherwise, show test mode
  // Fetch existing progress
  let progress = null;
  if (userId) {
    progress = await prisma.testProgress.findUnique({
      where: {
        userId_year_slot: {
          userId,
          year,
          slot,
        },
      },
    });
  }

  return (
    <TestPageClient
      year={year}
      slot={slot}
      questions={questions}
      questionsBySection={questionsBySection}
      sections={sections}
      initialProgress={progress ? {
        answers: JSON.parse(progress.answers),
        flagged: JSON.parse(progress.flagged),
        timeRemaining: progress.timeRemaining,
        currentSection: progress.currentSection,
        completed: progress.completed,
        score: progress.score,
      } : null}
    />
  );
}

