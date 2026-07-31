import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!genAI) {
      return NextResponse.json({ success: false, error: 'AI not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { question_html, option_a_html, option_b_html, option_c_html, option_d_html } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const prompt = `
    You are an expert CAT tutor. Please provide a clear, step-by-step explanation for the following question.
    
    Question: ${question_html}
    
    Options:
    A: ${option_a_html}
    B: ${option_b_html}
    C: ${option_c_html}
    D: ${option_d_html}
    
    Format your explanation in Markdown, using LaTeX for math equations. End by clearly stating the correct option.
    `;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text();

    return NextResponse.json({ success: true, data: explanation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to generate explanation' }, { status: 500 });
  }
}
