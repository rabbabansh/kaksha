import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ADMIN_EMAILS = ['ansh@kaksha.ai', 'ansh28babbar@gmail.com'];

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastChecked = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      // Send a heartbeat immediately
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const poll = async () => {
        try {
          const since = lastChecked;
          lastChecked = new Date();

          // New question attempts
          const attempts = await prisma.questionAttempt.findMany({
            where: { attemptedAt: { gte: since } },
            include: {
              user: { select: { name: true, email: true } },
              question: { select: { topic: true, subtopic: true, section: true } },
            },
            orderBy: { attemptedAt: 'desc' },
            take: 20,
          });

          // New users
          const newUsers = await prisma.user.findMany({
            where: { createdAt: { gte: since } },
            select: { name: true, email: true, createdAt: true },
          });

          // New completed sessions (mocks/diagnostics)
          const completedSessions = await prisma.session.findMany({
            where: { updatedAt: { gte: since }, completed: true },
            include: {
              user: { select: { name: true, email: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
          });

          const events: object[] = [];

          for (const a of attempts) {
            events.push({
              type: 'attempt',
              ts: a.attemptedAt.toISOString(),
              user: { name: a.user.name, email: a.user.email },
              topic: a.question?.topic,
              subtopic: a.question?.subtopic,
              section: a.question?.section,
              isCorrect: a.isCorrect,
              source: a.source,
            });
          }

          for (const u of newUsers) {
            events.push({
              type: 'signup',
              ts: u.createdAt.toISOString(),
              user: { name: u.name, email: u.email },
            });
          }

          for (const s of completedSessions) {
            events.push({
              type: 'session_complete',
              ts: s.updatedAt.toISOString(),
              user: { name: s.user.name, email: s.user.email },
              sessionType: s.type,
              correct: s.correct,
              incorrect: s.incorrect,
              total: s.totalQuestions,
            });
          }

          // Sort by timestamp
          events.sort((a, b) => new Date((b as { ts: string }).ts).getTime() - new Date((a as { ts: string }).ts).getTime());

          for (const event of events) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', ts: new Date().toISOString() })}\n\n`));
        } catch (err) {
          console.error('[SSE] poll error:', err);
        }
      };

      // Poll every 4 seconds
      const interval = setInterval(poll, 4000);

      // Clean up if client disconnects
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
