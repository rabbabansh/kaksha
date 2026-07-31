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
  searchParams: Promise<{ mode?: string; section?: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const { year, slot } = await params;
  const { mode, section } = await searchParams;
  const userId = (session.user as { id?: string })?.id;

  let actualYear = year;
  let actualSlot = slot;
  let sectionFilter: string | undefined = undefined;

  // Check if it's a sectional mock (format: year = "2024-sectional", slot = "Slot 1-QA")
  if (year.endsWith('-sectional')) {
    actualYear = year.replace('-sectional', '');
    const parts = slot.split('-');
    actualSlot = parts[0];
    // Normalize "Slot X" to "X" to match DB entries (e.g. "Slot 1" -> "1")
    if (actualSlot.toLowerCase().startsWith('slot ')) {
      actualSlot = actualSlot.replace(/slot\s+/i, '');
    }
    const secAbbr = parts[1];
    if (secAbbr === 'QA') sectionFilter = 'Quantitative Ability';
    else if (secAbbr === 'DILR') sectionFilter = 'Data Interpretation & Logical Reasoning';
    else if (secAbbr === 'VARC') sectionFilter = 'Verbal Ability & Reading Comprehension';
  } else if (section) {
    if (section === 'QA') sectionFilter = 'Quantitative Ability';
    else if (section === 'DILR') sectionFilter = 'Data Interpretation & Logical Reasoning';
    else if (section === 'VARC') sectionFilter = 'Verbal Ability & Reading Comprehension';
  }

  // Fetch questions for this test
  const questions = await prisma.questions.findMany({
    where: {
      year: actualYear,
      slot: actualSlot,
      section: sectionFilter || undefined,
    },
    orderBy: [
      { section: 'asc' },
      { question_id: 'asc' },
    ],
  });

  // Group questions by section
  const questionsBySection: Record<string, typeof questions> = {};
  questions.forEach(q => {
    const sName = q.section || 'Unknown';
    if (!questionsBySection[sName]) {
      questionsBySection[sName] = [];
    }
    questionsBySection[sName].push(q);
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
  let actualTimeRemaining = 40 * 60; // 40 mins

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

    if (progress && progress.timeRemaining !== null && !progress.completed) {
      const timeElapsedSecs = Math.floor((Date.now() - progress.updatedAt.getTime()) / 1000);
      actualTimeRemaining = Math.max(0, progress.timeRemaining - timeElapsedSecs);
    }
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
        timeRemaining: actualTimeRemaining,
        currentSection: progress.currentSection,
        completed: progress.completed,
        score: progress.score,
      } : null}
    />
  );
}

