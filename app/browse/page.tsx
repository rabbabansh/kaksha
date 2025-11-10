import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { BrowseClient } from '@/components/browse-client';

export default async function BrowsePage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  const questions = await prisma.questions.findMany();

  // Get unique topics and subtopics
  const topics = [...new Set(questions.map(q => q.topic).filter((t): t is string => Boolean(t)))].sort();
  const subtopics = [...new Set(questions.map(q => q.subtopic).filter((s): s is string => Boolean(s)))].sort();
  const sections = [...new Set(questions.map(q => q.section).filter((s): s is string => Boolean(s)))].sort();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Browse Questions</h1>
        <p className="text-muted-foreground">
          Search and filter questions by topic, subtopic, section, and more
        </p>
      </div>
      <BrowseClient
        questions={questions}
        topics={topics}
        subtopics={subtopics}
        sections={sections}
      />
    </div>
  );
}


