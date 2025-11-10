import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ProgressClient } from '@/components/progress-client';

export default async function ProgressPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your performance across all sections, topics, and subtopics
        </p>
      </div>
      <ProgressClient />
    </div>
  );
}


