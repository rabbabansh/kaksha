/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    const stripBloat = (html: string | undefined | null) => {
      if (!html) return '';
      // Remove class, style, id, and data-* attributes to save AI tokens
      return html.replace(/\s+(class|style|id|data-[a-zA-Z0-9-]+)="[^"]*"/g, '');
    };

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
      userQuery,
      chatHistory
    } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    let prompt = '';
    
    if (userQuery) {
      let historyText = '';
      if (chatHistory && chatHistory.length > 0) {
        historyText = chatHistory.map((msg: any) => `${msg.role === 'user' ? 'STUDENT' : 'TUTOR'}: ${msg.text}`).join('\n\n');
      }

      // Interactive Follow-up Chat Mode
      prompt = `
      You are an expert CAT tutor. A student is asking a follow-up doubt about a question.
      
      Question Context: ${stripBloat(question_html)}
      Correct Answer: Option ${answer}
      Official Solution Context: ${stripBloat(explanation_html) || 'Not provided'}
      
      Previous Conversation:
      ${historyText || 'No previous context.'}

      Student's New Doubt: "${userQuery}"
      
      Provide a highly targeted, crisp, and intuitive explanation specifically addressing the student's doubt. Use standard markdown. STRICTLY enforce perfectly formatted LaTeX for any math equations, variables, or numbers using Notion-style delimiters (wrap inline math with single $ and block math with $$). Do NOT use \\( or \\) or \\[ or \\].
      `;
    } else {
      // One-Time Generation Mode (Dual-Method)
      prompt = `
      You are an elite CAT coach. Generate a world-class, intuitive, and step-by-step solution for the following question.
      Assume the student has NOT seen any other explanation. Your explanation must be completely self-sufficient and simple to follow.
      
      Question: ${stripBloat(question_html)}
      Options: 
      A: ${stripBloat(option_a_html)} | B: ${stripBloat(option_b_html)} | C: ${stripBloat(option_c_html)} | D: ${stripBloat(option_d_html)}
      Correct Answer: Option ${answer}
      Official Base Solution (for grounding/accuracy only, do not refer to it directly): ${stripBloat(explanation_html) || 'Not provided'}
      
      Your output MUST be structured into exactly three sections using standard markdown headers, with plenty of breathing room (blank lines between paragraphs/steps).
      STRICTLY enforce perfectly formatted LaTeX for any math equations, variables, or numbers using Notion-style delimiters (wrap inline math with single $ and block math with $$). Do NOT use \\( or \\) or \\[ or \\].
      
      ### 1. The Standard Approach
      Provide a rigorous, step-by-step mathematical or logical method. Break it down into clear, numbered steps. Use markdown tables if helpful and perfectly rendered LaTeX for math. Explain the "why" behind each step.
      
      ### 2. Formulas & Concepts Used
      List any formulas, theorems, or core concepts utilized in this problem. If none, briefly state the core logical principle.
      
      ### 3. The "CAT Trick" (Speed Strategy)
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
