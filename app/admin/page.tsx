import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Activity, Flag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTable } from '@/components/admin-users-table';
import { AdminReportsTable } from '@/components/admin-reports-table';

const ADMIN_EMAILS = ['ansh@kaksha.ai', 'ansh28babbar@gmail.com'];

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard');
  }

  // Fetch aggregate stats
  const [totalUsers, totalQuestions, totalAttempts, totalReports] = await Promise.all([
    prisma.user.count(),
    prisma.questions.count(),
    prisma.questionAttempt.count(),
    prisma.reportedQuestion.count(),
  ]);

  // Fetch all users with their profiles
  const users = await prisma.user.findMany({
    include: {
      profile: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch reported questions
  const reportedQuestions = await prisma.reportedQuestion.findMany({
    include: {
      user: { select: { name: true, email: true } },
      question: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Control Center</h1>
        <p className="text-muted-foreground">Manage platform content and view global statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Global Attempts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reported Questions</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users Directory</TabsTrigger>
          <TabsTrigger value="reports">Reported Questions</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <AdminUsersTable users={users} />
        </TabsContent>
        <TabsContent value="reports">
          <AdminReportsTable reports={reportedQuestions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
