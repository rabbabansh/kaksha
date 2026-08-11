import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Flag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTable } from '@/components/admin-users-table';
import { AdminReportsTable } from '@/components/admin-reports-table';
import { AdminStatsBar } from '@/components/admin-stats-bar';
import { AdminLiveFeed } from '@/components/admin-live-feed';
import { AdminActivityLog } from '@/components/admin-activity-log';
import { AdminDiagnosticsTable } from '@/components/admin-diagnostics-table';

const ADMIN_EMAILS = ['ansh@kaksha.ai', 'ansh28babbar@gmail.com'];

export default async function AdminDashboardPage() {
  const session = await getAuthSession();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard');
  }

  // Fetch aggregate stats & table data in parallel
  const [totalQuestions, totalReports, users, reportedQuestions, diagnosticSessions] = await Promise.all([
    prisma.questions.count(),
    prisma.reportedQuestion.count(),
    prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reportedQuestion.findMany({
      include: {
        user: { select: { name: true, email: true } },
        question: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.session.findMany({
      where: { type: 'DIAGNOSTIC' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                strengths: true,
                weaknesses: true,
                kakshaScore: true,
                targetExamYear: true,
                onboardingCompleted: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-primary">Admin Control Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Logged in as <span className="font-semibold text-foreground">{session.user.email}</span>
        </p>
      </div>

      {/* Live stats bar — auto-refreshes every 30s */}
      <AdminStatsBar />

      {/* Static server-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Question Bank</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total questions in DB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reported Questions</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="live">🔴 Live Feed</TabsTrigger>
          <TabsTrigger value="users">Users Directory</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="reports">Reported Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <AdminLiveFeed />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsersTable users={users} />
        </TabsContent>

        <TabsContent value="activity">
          <AdminActivityLog />
        </TabsContent>

        <TabsContent value="diagnostics">
          <AdminDiagnosticsTable diagnostics={diagnosticSessions} />
        </TabsContent>

        <TabsContent value="reports">
          <AdminReportsTable reports={reportedQuestions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
