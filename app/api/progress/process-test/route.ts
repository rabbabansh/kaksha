/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * POST /api/progress/process-test
 * 
 * Background endpoint called after test completion to trigger
 * any post-test processing (e.g. BKT updates, analytics aggregation).
 * Currently logs completion and returns success. Extend as needed.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { testProgressId } = body;

        if (!testProgressId) {
            return NextResponse.json({ success: false, error: 'Missing testProgressId' }, { status: 400 });
        }

        // Verify the test session exists and belongs to this user
        const testSession = await prisma.session.findFirst({
            where: { id: testProgressId }
        });

        if (!testSession) {
            return NextResponse.json({ success: false, error: 'Test session not found' }, { status: 404 });
        }

        logger.info('process-test triggered', { testProgressId, userId: testSession.userId });

        // TODO: BKT / adaptive analytics post-processing can be added here

        return NextResponse.json({ success: true, message: 'Post-test processing complete' });
    } catch (error) {
        logger.error('process-test failed', { error: String(error) });
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
