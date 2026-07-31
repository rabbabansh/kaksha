import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

import prisma from '@/lib/prisma';

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
    const { 
      question_id, 
      question_html, 
      option_a_html, 
      option_b_html, 
      option_c_html, 
      option_d_html,
      answer,
      explanation_html,
      userQuery 
    } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    let prompt = '';
    
    if (userQuery) {
      // Interactive Follow-up Chat Mode
      prompt = `
      You are an expert CAT tutor. A student is asking a follow-up doubt about a question.
      
      Question Context: ${question_html}
      Correct Answer: Option ${answer}
      Official Solution Context: ${explanation_html || 'Not provided'}
      
      Student's Doubt: "${userQuery}"
      
      Provide a highly targeted, crisp, and intuitive explanation specifically addressing the student's doubt. Use standard markdown and perfectly rendered LaTeX for any math equations.
      `;
    } else {
      // One-Time Generation Mode (Dual-Method)
      prompt = `
      You are an elite CAT coach. Generate a world-class, intuitive, and step-by-step solution for the following question.
      
      Question: ${question_html}
      Options: 
      A: ${option_a_html} | B: ${option_b_html} | C: ${option_c_html} | D: ${option_d_html}
      Correct Answer: Option ${answer}
      Official Base Solution (for grounding/accuracy): ${explanation_html || 'Not provided'}
      
      Your output MUST be structured into exactly two sections using standard markdown headers:
      
      ### 1. The Standard Approach
      Provide the rigorous, textbook mathematical or logical method. Make it extremely clear. Use markdown tables if helpful and perfectly rendered LaTeX for math.
      
      ### 2. The "CAT Trick" (Speed Strategy)
      Provide the fastest way a 99-percentiler would solve this in under 30 seconds. This could be option elimination, approximation, substituting values, or a reading shortcut. If there is no trick, explain how to quickly verify the standard approach.
      `;
    }

    const result = await model.generateContent(prompt);
    const generatedExplanation = result.response.text();

    // If this was a one-time generation and there was NO static explanation before, save it to the DB!
    if (!userQuery && !explanation_html && question_id) {
      try {
        await prisma.questions.update({
          where: { question_id },
          data: { explanation_html: generatedExplanation }
        });
      } catch (dbError) {
        console.error('Failed to save one-time generation to DB:', dbError);
        // We don't fail the request if the cache save fails
      }
    }

    return NextResponse.json({ success: true, data: generatedExplanation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to generate explanation' }, { status: 500 });
  }
}
