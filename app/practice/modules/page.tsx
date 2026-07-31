import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PracticeLibraryClient } from '@/components/practice-library-client';

export default async function PracticeModulesPage() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    redirect('/login');
  }

  const progressRecords = await prisma.userProgress.findMany({
    where: { userId: user.id },
    select: {
      section: true,
      topic: true,
      subtopic: true,
      correctCount: true,
      totalQuestions: true,
      masteryLevel: true
    }
  });

  return <PracticeLibraryClient progressRecords={progressRecords} />;
}
