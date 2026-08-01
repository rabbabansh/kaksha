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

        // Upsert user profile
        await prisma.userProfile.upsert({
            where: { userId: user.id },
            update: {
                age: parseInt(age),
                targetExamYear: targetExamYear.toString(),
                selfStrengths: JSON.stringify(selfStrengths || []),
                selfWeaknesses: JSON.stringify(selfWeaknesses || []),
                // We do NOT set onboardingCompleted to true here.
                // It is set to true ONLY after completing the diagnostic test.
            },
            create: {
                userId: user.id,
                age: parseInt(age),
                targetExamYear: targetExamYear.toString(),
                selfStrengths: JSON.stringify(selfStrengths || []),
                selfWeaknesses: JSON.stringify(selfWeaknesses || []),
            }
        });

        logger.info(`${operation} completed`, { userId: user.id, correlationId });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error(`${operation} failed`, { error: String(error), correlationId });
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
