import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TestSelectionClient } from '@/components/test-selection-client';

export default async function HomePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  const questions = await prisma.questions.findMany();

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
}