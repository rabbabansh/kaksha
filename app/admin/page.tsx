import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AdminQuestionForm } from '@/components/admin-question-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Activity } from 'lucide-react';

const ADMIN_EMAIL = 'ansh@kaksha.ai';

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect('/dashboard');
  }

  // Fetch aggregate stats
  const [totalUsers, totalQuestions, totalAttempts] = await Promise.all([
    prisma.user.count(),
    prisma.questions.count(),
    prisma.questionAttempt.count(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Control Center</h1>
        <p className="text-muted-foreground">Manage platform content and view global statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Global Question Attempts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AdminQuestionForm />
      </div>
    </div>
  );
}
