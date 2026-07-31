import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { logger } from '@/lib/logger';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const operation = 'generate_formative_feedback';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, correlationId },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question_html, option_a_html, option_b_html, option_c_html, option_d_html, answer, userAnswer, subtopic } = body;

    if (!question_html || !userAnswer || !answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required question data', code: ErrorCode.VALIDATION_ERROR, correlationId },
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
    const prompt = `
    You are an expert CAT tutor coaching a student on "${subtopic || 'a topic'}". 
    The student just answered a question incorrectly. Assume they haven't seen any other explanation.

    Question:
    ${question_html}

    Options:
    A: ${option_a_html}
    B: ${option_b_html}
    C: ${option_c_html}
    D: ${option_d_html}

    Correct Answer: ${answer}
    Student's Answer: ${userAnswer}

    Your task:
    Provide a clear, self-sufficient "Formative Feedback" breakdown formatted in Markdown with plenty of breathing room (blank lines between paragraphs).
    
    Structure your response into these sections:
    
    ### 1. Where You Went Wrong
    Acknowledge their mistake gracefully. Explain the specific logical flaw, miscalculation, or trap they fell into by choosing ${userAnswer}.
    
    ### 2. The Correct Methodology
    Coach them step-by-step on how to arrive at ${answer}. Break it down simply.
    
    ### 3. Key Takeaway & Formulas
    List the core formula or concept they should remember from this mistake.

    Do NOT ask them another question. Provide clear, encouraging feedback.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info(`${operation} generated feedback`, { correlationId });

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
