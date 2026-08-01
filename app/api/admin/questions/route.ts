/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode } from '@/lib/action-response';

const ADMIN_EMAIL = 'ansh@kaksha.ai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['question_id', 'year', 'slot', 'section', 'topic', 'subtopic', 'question_html', 'answer'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Insert question
    const question = await prisma.questions.create({
      data: {
        question_id: body.question_id,
        year: body.year,
        slot: body.slot,
        section: body.section,
        topic: body.topic,
        subtopic: body.subtopic,
        question_html: body.question_html,
        option_a_html: body.option_a_html || null,
        option_b_html: body.option_b_html || null,
        option_c_html: body.option_c_html || null,
        option_d_html: body.option_d_html || null,
        answer: body.answer,
        explanation_html: body.explanation_html || null,
      }
    });

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
