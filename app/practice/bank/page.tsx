import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { BrowseClient } from '@/components/browse-client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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


