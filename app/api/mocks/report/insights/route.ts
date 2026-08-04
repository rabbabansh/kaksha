import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED }, { status: 401 });
    }

    let userId = (session.user as { id?: string })?.id;
    if (!userId && session.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID not found' }, { status: 400 });
    }

    const body = await request.json();
    const { year, slot, stats, userQuery, chatHistory } = body;

    if (!year || !slot || !stats) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const isFollowUp = !!userQuery;

    const testProgress = await prisma.session.findFirst({
      where: { userId, year, slot, type: 'MOCK' },
      orderBy: { createdAt: 'desc' }
    });

    if (!testProgress) {
      return NextResponse.json({ success: false, error: 'Mock attempt not found' }, { status: 404 });
    }

    // If initial request and insights already exist, return them
    if (!isFollowUp && testProgress.aiInsights) {
       return NextResponse.json({
         success: true,
         data: testProgress.aiInsights,
         correlationId
       });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = '';
    if (isFollowUp) {
       prompt = `You are an expert CAT coach analyzing a student's mock test performance.
Mock Test: CAT ${year} Slot ${slot}
Student's Performance Breakdown:
${JSON.stringify(stats, null, 2)}

The student has asked a follow-up question regarding their performance report.
Chat History:
${JSON.stringify(chatHistory, null, 2)}

Student's new query: "${userQuery}"

Provide a crisp, actionable, and encouraging response formatted in Markdown. Do not use generic pleasantries. Focus heavily on strategy, time management, and topic selection based on the data.`;
    } else {
       prompt = `You are an expert CAT coach analyzing a student's mock test performance.
Mock Test: CAT ${year} Slot ${slot}
Student's Performance Breakdown:
${JSON.stringify(stats, null, 2)}

Your task is to generate a comprehensive, highly actionable Mock Report Card Insight.
1. Highlight their strongest section and explain why.
2. Identify their weakest section and point out if they are losing marks due to inaccuracy (too many incorrect) or low attempt rate (too many skipped).
3. Provide 3 concrete, strategic next steps for their preparation.

Format beautifully in Markdown using bullet points, bold text for emphasis, and clear headings. Do NOT output a markdown code block wrapper (\`\`\`markdown). Just output the raw markdown text. Keep it professional yet encouraging.`;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // If it's the initial generation, save it to the DB
    if (!isFollowUp) {
      await prisma.session.update({
        where: { id: testProgress.id },
        data: { aiInsights: responseText }
      });
    }

    return NextResponse.json({
      success: true,
      data: responseText,
      correlationId
    });

  } catch (error) {
    console.error('Mock AI Insights failed:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
