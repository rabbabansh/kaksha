import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { logger } from '@/lib/logger';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const operation = 'generate_concept_primer';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subtopic = searchParams.get('subtopic');

    if (!subtopic) {
      return NextResponse.json(
        { success: false, error: 'subtopic is required', code: ErrorCode.VALIDATION_ERROR, correlationId },
        { status: 400 }
      );
    }

    // Fetch user progress for this subtopic FIRST
    let userId = (session.user as any).id;
    if (!userId && session.user.email) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (dbUser) userId = dbUser.id;
    }
    
    let grade = 'N/A';
    let masteryLevel = 0;
    
    if (userId) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const progress = await prisma.userProgress.findFirst({
        where: { userId, subtopic }
      });
      if (progress) {
        masteryLevel = Math.round(progress.masteryLevel * 100);
        if (masteryLevel >= 90) grade = 'S';
        else if (masteryLevel >= 80) grade = 'A';
        else if (masteryLevel >= 70) grade = 'B';
        else if (masteryLevel >= 60) grade = 'C';
        else if (masteryLevel >= 50) grade = 'D';
        else grade = 'F';
      }
    }

    let text = 'Get ready to master this topic!';

    try {
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const prompt = `You are an expert CAT tutor. A student is about to start a practice session on the subtopic: "${subtopic}". 
        Provide a highly encouraging, 2-paragraph "Concept Primer". 
        The first paragraph should explain the core concept in simple terms.
        The second paragraph should give 1 golden rule or formula to remember for this topic.
        Keep it concise, formatting in Markdown. Do not include any questions.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        logger.info(`${operation} generated primer`, { correlationId, subtopic });
      } else {
        logger.warn(`${operation} AI not configured, returning fallback`, { correlationId, subtopic });
      }
    } catch (aiError) {
      logger.error(`${operation} AI generation failed`, {
        correlationId,
        error: aiError instanceof Error ? aiError.message : String(aiError)
      });
      // Continue with fallback text
    }

    return NextResponse.json({
      success: true,
      data: {
        primerText: text,
        masteryLevel,
        grade
      },
      correlationId
    });

  } catch (error) {
    logger.error(`${operation} failed completely`, {
      correlationId,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
