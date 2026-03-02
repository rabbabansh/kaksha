import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserProgressStats } from '@/lib/progress';
import prisma from '@/lib/prisma';
import { logger, createTimer } from '@/lib/logger';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';

export async function GET() {
    const correlationId = generateCorrelationId();
    const timer = createTimer();
    const operation = 'get_ai_progress_analysis';

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
                { status: 401 }
            );
        }

        let userId = (session.user as { id?: string })?.id;
        if (!userId && session.user?.email) {
            const dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true },
            });
            if (dbUser) userId = dbUser.id;
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID not found', code: ErrorCode.NOT_FOUND, correlationId },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Gemini API key not configured', code: ErrorCode.INTERNAL_ERROR, correlationId },
                { status: 500 }
            );
        }

        // Gather all necessary context
        const [progressStats, completedTests, recentAttempts] = await Promise.all([
            getUserProgressStats(userId),
            prisma.testProgress.findMany({
                where: { userId, completed: true },
                orderBy: { updatedAt: 'desc' },
                take: 5,
            }),
            prisma.questionAttempt.findMany({
                where: { userId },
                orderBy: { attemptedAt: 'desc' },
                take: 200,
                include: {
                    // Fetch subtopic info via questions relation
                },
            }),
        ]);

        // Build topic-level accuracy from attempts
        const recentAttemptQuestionIds = recentAttempts.map((a) => a.questionId);
        const questionDetails = await prisma.questions.findMany({
            where: { question_id: { in: recentAttemptQuestionIds } },
            select: { question_id: true, section: true, topic: true, subtopic: true },
        });

        const qDetailsMap = new Map(questionDetails.map((q) => [q.question_id, q]));
        // Build topic accuracy map: { "section > topic > subtopic": {correct, total} }
        const topicAccuracy = new Map<string, { correct: number; total: number }>();
        for (const attempt of recentAttempts) {
            const q = qDetailsMap.get(attempt.questionId);
            if (!q || !q.section || !q.topic || !q.subtopic) continue;
            const key = `${q.section} > ${q.topic} > ${q.subtopic}`;
            const existing = topicAccuracy.get(key) || { correct: 0, total: 0 };
            existing.total += 1;
            if (attempt.isCorrect) existing.correct += 1;
            topicAccuracy.set(key, existing);
        }

        const topicSummaryLines = Array.from(topicAccuracy.entries())
            .sort(([, a], [, b]) => (b.correct / b.total) - (a.correct / a.total))
            .map(([key, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100);
                return `- ${key}: ${stats.correct}/${stats.total} correct (${pct}%)`;
            })
            .join('\n');

        const completedTestsSummary = completedTests
            .map((t) => {
                const answers = JSON.parse(t.answers || '{}') as Record<string, string>;
                const answeredCount = Object.values(answers).filter((v) => v && v.trim() !== '').length;
                return `- CAT ${t.year} ${t.slot}: Score ${t.score ?? 'N/A'}, Answered ${answeredCount} questions, Completed on ${t.updatedAt.toLocaleDateString()}`;
            })
            .join('\n');

        const TODAY = new Date();
        const EXAM_DATE = new Date('2025-11-30');
        const DAYS_REMAINING = Math.ceil((EXAM_DATE.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));

        const systemPrompt = `You are an expert CAT (Common Admission Test) coach and data analyst. Today is ${TODAY.toLocaleDateString()} and the CAT exam is on November 30, 2025 (${DAYS_REMAINING} days remaining).

Based on the student's complete performance data below, provide a detailed, actionable analysis.

## OVERALL PERFORMANCE
- Kaksha Score: ${progressStats.kakshaScore}%
- Total Questions Attempted: ${progressStats.totalAttempts}
- Total Correct: ${progressStats.totalCorrect}
- Overall Accuracy: ${progressStats.totalAttempts > 0 ? Math.round((progressStats.totalCorrect / progressStats.totalAttempts) * 100) : 0}%

## COMPLETED FULL TESTS
${completedTestsSummary || 'No completed tests yet.'}

## SECTION-WISE PERFORMANCE
${progressStats.sections.map((s) => `- ${s.section}: ${s.percentage}%`).join('\n') || 'No section data yet.'}

## STRENGTHS (best performing subtopics)
${progressStats.strengths.length > 0 ? progressStats.strengths.map((s) => `- ${s}`).join('\n') : 'Not enough data yet.'}

## WEAKNESSES (lowest performing subtopics)
${progressStats.weaknesses.length > 0 ? progressStats.weaknesses.map((w) => `- ${w}`).join('\n') : 'Not enough data yet.'}

## TOPIC-LEVEL ACCURACY (from all attempts)
${topicSummaryLines || 'No detailed attempt data yet.'}

---

Please provide a comprehensive analysis in the following structure using markdown:

## 💡 Performance Summary
A 2-3 sentence executive summary of their current CAT preparation status.

## ✅ Key Strengths
List 3-5 specific topics/subtopics where the student performs well. Explain WHY this is an advantage for CAT.

## ⚠️ Areas Needing Improvement
List 3-5 specific topics/subtopics with the weakest accuracy. For each, provide 1-2 concrete tips to improve.

## 📅 Preparation Roadmap
Given ${DAYS_REMAINING} days remaining until CAT:
- Break down a weekly study plan (high-level) with clear priorities
- Specify which sections to focus on first based on current weaknesses
- Suggest a test-taking frequency (mock tests per week)

## 🎯 Immediate Action Items
List 3-5 specific things the student should do THIS WEEK to improve their score.

Be specific, data-driven, and encouraging. Use the exact topic and subtopic names from the data.`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(systemPrompt);
        const analysisText = result.response.text();

        logger.info(`${operation} completed`, {
            operation,
            correlationId,
            duration: timer.elapsed(),
            userId,
        });

        return NextResponse.json({
            success: true,
            data: { analysis: analysisText },
            correlationId,
        });
    } catch (error) {
        logger.error(`${operation} failed`, {
            operation,
            correlationId,
            duration: timer.elapsed(),
            error: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
            { status: 500 }
        );
    }
}
