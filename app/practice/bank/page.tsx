export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { BrowseClient } from '@/components/browse-client';
import { authOptions } from "@/lib/auth";

// Strip HTML tags to get plain text for search
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
}

export default async function BrowsePage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect('/login');
    }

    // Fetch metadata + question HTML (stripped) for full-text search
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
        question_html: true,
      },
    });

    // Build questionTexts map (strip HTML for client-side search)
    const questionTexts: Record<string, string> = {};
    questions.forEach(q => {
      if (q.question_html) {
        questionTexts[q.question_id] = stripHtml(q.question_html);
      }
    });

    // Strip question_html from questions before passing to client (saves bandwidth)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questionsForClient = questions.map(({ question_html: _qh, ...rest }) => rest) as any[];

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attemptMap = attempts.reduce((acc: any, curr) => {
      if (!acc[curr.questionId]) {
        acc[curr.questionId] = curr;
      }
      return acc;
    }, {});

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

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Browse Questions</h1>
          <p className="text-muted-foreground">
            Search by topic, subtopic, year, or question text
          </p>
        </div>
        <BrowseClient
          questions={questionsForClient}
          topics={topics}
          subtopics={subtopics}
          sections={sections}
          attemptMap={attemptMap}
          questionTexts={questionTexts}
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
