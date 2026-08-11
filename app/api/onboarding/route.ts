/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ErrorCode, generateCorrelationId } from '@/lib/action-response';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    const correlationId = generateCorrelationId();
    const operation = 'submit_onboarding';
    
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { age, targetExamYear, selfStrengths, selfWeaknesses } = body;

        // Sanitize values to prevent NaN or undefined crashes (especially for "Skip for now" actions)
        const parsedAge = (age && !isNaN(parseInt(age))) ? parseInt(age) : null;
        const examYear = targetExamYear ? targetExamYear.toString() : '';

        // Upsert user profile
        await prisma.userProfile.upsert({
            where: { userId: user.id },
            update: {
                age: parsedAge,
                targetExamYear: examYear,
                selfStrengths: JSON.stringify(selfStrengths || []),
                selfWeaknesses: JSON.stringify(selfWeaknesses || []),
                onboardingCompleted: true,
            },
            create: {
                userId: user.id,
                age: parsedAge,
                targetExamYear: examYear,
                selfStrengths: JSON.stringify(selfStrengths || []),
                selfWeaknesses: JSON.stringify(selfWeaknesses || []),
                onboardingCompleted: true,
            }
        });

        logger.info(`${operation} completed`, { userId: user.id, correlationId });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error(`${operation} failed`, { error: String(error), correlationId });
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
