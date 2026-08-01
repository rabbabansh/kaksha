import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
    const { year, slot, isPractice, contextData } = body;

    let systemPrompt = `You are an expert AI Tutor analyzing a student's test performance. 
Keep your insights SHORT, CONCISE, and ACTIONABLE (around 2-3 paragraphs max). 
Use markdown. Highlight strengths, pinpoint weaknesses based on time taken and incorrect answers, and suggest a very brief next-step strategy.`;

    if (!genAI) {
      return NextResponse.json({ success: false, error: 'AI not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    let userPrompt = `Here is the student's performance data:\n${JSON.stringify(contextData, null, 2)}`;
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await model.generateContent(prompt);
    const insight = result.response.text();

    // If it's a diagnostic/mock test, save it to TestProgress
    if (!isPractice && year && slot) {
      const progress = await prisma.testProgress.findUnique({
        where: { userId_year_slot: { userId, year, slot } }
      });
      if (progress) {
        await prisma.testProgress.update({
          where: { id: progress.id },
          data: { aiInsights: insight }
        });
      }
    }

    return NextResponse.json({ success: true, data: insight });
  } catch (error) {
    console.error('AI Insights Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
