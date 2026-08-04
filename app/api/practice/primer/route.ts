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

    if (!genAI) {
      return NextResponse.json(
        { success: false, error: 'AI not configured', code: ErrorCode.INTERNAL_ERROR, correlationId },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const prompt = `You are an expert CAT tutor. A student is about to start a practice session on the subtopic: "${subtopic}". 
    Provide a highly encouraging, 2-paragraph "Concept Primer". 
    The first paragraph should explain the core concept in simple terms.
    The second paragraph should give 1 golden rule or formula to remember for this topic.
    Keep it concise, formatting in Markdown. Do not include any questions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info(`${operation} generated primer`, { correlationId, subtopic });

    return NextResponse.json({
      success: true,
      data: text,
      correlationId
    });

  } catch (error) {
    logger.error(`${operation} failed`, {
      correlationId,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
      { status: 500 }
    );
  }
}
return NextResponse.json(
  { success: false, error: 'Internal server error', code: ErrorCode.INTERNAL_ERROR, correlationId },
  { status: 500 }
);
  }
}
