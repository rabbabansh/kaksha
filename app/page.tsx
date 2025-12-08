import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TestSelectionClient } from '@/components/test-selection-client';

export default async function HomePage() {
  try {
    const session = await getAuthSession();

    if (!session) {
      redirect('/login');
    }

    // Only fetch minimal fields needed for test selection (year, slot, question_id)
    // This avoids exceeding Prisma Accelerate's 5MB response limit
    const questions = await prisma.questions.findMany({
      select: {
        question_id: true,
        year: true,
        slot: true,
      },
    });

    // Organize questions by year -> slot
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

    // Get user's test progress
    const userId = (session.user as { id?: string })?.id;
    const userProgress = userId ? await prisma.testProgress.findMany({
      where: { userId },
      select: { year: true, slot: true, completed: true, score: true },
    }) : [];

    const progressMap = new Map(
      userProgress.map(p => [`${p.year}-${p.slot}`, p])
    );

    return (
      <TestSelectionClient byYearSlot={byYearSlot} progressMap={progressMap} />
    );
  } catch (error) {
    console.error('Error loading home page:', error);
    // Return a basic error UI instead of crashing
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Error Loading Page</h1>
        <p className="text-muted-foreground">
          There was an error loading the page. Please try refreshing.
        </p>
      </div>
    );
  }
}