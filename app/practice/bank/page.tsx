/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { BrowseClient } from '@/components/browse-client';
import { authOptions } from "@/lib/auth";

export default async function BrowsePage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/login');
    }

    // Fetch only minimal metadata to avoid exceeding Prisma Accelerate's 5MB limit
    // Full question data (HTML, options, explanations) will be fetched on demand via API
    const questions = await prisma.questions.findMany({
      select: {
        question_id: true,
        year: true,
        slot: true,
        section: true,
        topic: true,
        subtopic: true,
        question_type: true,
        set_id: true,
        // Exclude all HTML fields - they'll be fetched on demand when viewing a question
        // This keeps the response well under 5MB
      },
    });

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }

    const attempts = userId ? await prisma.questionAttempt.findMany({
      where: { userId },
      select: { questionId: true, isCorrect: true, timeTaken: true },
      orderBy: { attemptedAt: 'desc' }
    }) : [];

    // Map the most recent attempt for each question
    const attemptMap = attempts.reduce((acc: any, curr) => {
      if (!acc[curr.questionId]) {
        acc[curr.questionId] = curr;
      }
      return acc;
    }, {});

    // Get unique topics and subtopics
    const topics = [...new Set(questions.map(q => q.topic).filter((t): t is string => Boolean(t)))].sort();
    const subtopics = [...new Set(questions.map(q => q.subtopic).filter((s): s is string => Boolean(s)))].sort();
    
    const order = ['VARC', 'DILR', 'QA'];
    const sections = [...new Set(questions.map(q => q.section).filter((s): s is string => Boolean(s)))]
      .sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });

    const { getUserProgressStats } = await import('@/lib/progress');
    const stats = userId ? await getUserProgressStats(userId) : { strengths: [], weaknesses: [] };

    return (
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground">
            Search, filter, and practice specific questions to master your weaknesses.
          </p>
        </div>
        <BrowseClient
          questions={questions}
          topics={topics}
          subtopics={subtopics}
          sections={sections}
          attemptMap={attemptMap}
          recommended={stats}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading browse page:', error);
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Browse Questions</h1>
          <p className="text-muted-foreground text-red-500">
            Error loading questions. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}


