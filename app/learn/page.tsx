import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { MasterPathsClient } from '@/components/master-paths-client';

export default async function LearnPage() {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Mastery Learning Paths 🎓
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Visualize your progression through the 3 master sectional paths of CAT preparation.
        </p>
      </div>
      <MasterPathsClient progressRecords={progressRecords} />
    </div>
  );
}
