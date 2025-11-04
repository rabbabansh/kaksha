import prisma from '@/lib/prisma';
import { QuestionBrowser } from '@/components/question-browser';
import { PYQView } from '@/components/pyq-view';
import { TopicViewWrapper } from '@/components/topic-view-wrapper';
import { ViewSwitcher } from '@/components/view-switcher';
import { getServerSession } from 'next-auth';

export default async function HomePage() {
  const session = await getServerSession();

  if (!session) {
    // You can create a more user-friendly login prompt here
    return <p>Please log in to view questions.</p>;
  }

  const questions = await prisma.questions.findMany();

  // Get unique topics and subtopics for the filters
  const topics = [...new Set(questions.map(q => q.topic).filter((t): t is string => Boolean(t)))];
  const subtopics = [...new Set(questions.map(q => q.subtopic).filter((s): s is string => Boolean(s)))];

  // Organize questions by year -> slot for PYQView
  // Structure: { year: { slot: [questions] } }
  const byYearSlot: Record<string, Record<string, typeof questions>> = {};
  
  questions.forEach(q => {
    const year = q.year || 'Unknown';
    const slot = q.slot || 'Unknown';
    
    if (!byYearSlot[year]) {
      byYearSlot[year] = {};
    }
    if (!byYearSlot[year][slot]) {
      byYearSlot[year][slot] = [];
    }
    byYearSlot[year][slot].push(q);
  });

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">CAT Question Bank</h1>
      <ViewSwitcher
        pyqView={<PYQView byYearSlot={byYearSlot} />}
        topicView={<TopicViewWrapper allQuestions={questions} />}
        browserView={
          <QuestionBrowser 
            allQuestions={questions}
            topics={topics}
            subtopics={subtopics}
          />
        }
      />
    </main>
  );
}