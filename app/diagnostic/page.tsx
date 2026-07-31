/* eslint-disable */
import { getAuthSession, getUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { DiagnosticWrapper } from '@/components/diagnostic-wrapper';

export default async function DiagnosticPage() {
    const session = await getAuthSession();
    if (!session) redirect('/login');

    const profile = await getUserProfile();
    if (!profile) redirect('/onboarding');
    
    // If they already finished onboarding, don't let them take the diagnostic again.
    if (profile.onboardingCompleted) redirect('/dashboard');

    const sections = ['VARC', 'DILR', 'QA'];
    
    const varcIds = [
      'ReadingComprehension-ReadingComprehension-P1-Set1-Q1',
      'ReadingComprehension-ReadingComprehension-P1-Set1-Q2',
      'ReadingComprehension-ReadingComprehension-P1-Set1-Q3',
      'ReadingComprehension-ReadingComprehension-P1-Set1-Q4',
      'ParaSummary-ParaSummary-Q1',
      'ParaSummary-ParaSummary-Q2',
      'ParaJumbles-ParaJumbles-Q1',
      'ParaJumbles-ParaJumbles-Q2',
      'ParaCompletion-ParaCompletion-Q1',
      'ParaCompletion-ParaCompletion-Q2'
    ];

    const dilrIds = [
      'DI-Games&Tournaments--P1-Set1-Q1',
      'DI-Games&Tournaments--P1-Set1-Q2',
      'DI-Games&Tournaments--P1-Set1-Q3',
      'DI-Games&Tournaments--P1-Set1-Q4',
      'DI-Games&Tournaments--P1-Set1-Q5',
      'DI-Tables&Graphs--P1-Set1-Q1',
      'DI-Tables&Graphs--P1-Set1-Q2',
      'DI-Tables&Graphs--P1-Set1-Q3',
      'DI-Tables&Graphs--P1-Set1-Q4',
      'LR-VennDiagram--P1-Set1-Q1'
    ];

    const qaIds = [
      'CAT2024S1-QA-A-A--1',
      'CAT2024S1-QA-A-F&G--1',
      'CAT2024S1-QA-A-L--1',
      'CAT2024S1-QA-A-MAR&R--1',
      'CAT2024S1-QA-A-NT--1',
      'CAT2024S1-QA-A-NT--2',
      'CAT2024S1-QA-A-P&L--1',
      'CAT2024S1-QA-A-P&L--2',
      'CAT2024S1-QA-A-QE--1',
      'CAT2024S1-QA-A-S&CI--1'
    ];

    // Fetch and order VARC questions
    const varcQuestions = await prisma.questions.findMany({
        where: { question_id: { in: varcIds } }
    });
    varcQuestions.sort((a, b) => varcIds.indexOf(a.question_id) - varcIds.indexOf(b.question_id));

    // Fetch and order DILR questions
    const dilrQuestions = await prisma.questions.findMany({
        where: { question_id: { in: dilrIds } }
    });
    dilrQuestions.sort((a, b) => dilrIds.indexOf(a.question_id) - dilrIds.indexOf(b.question_id));

    // Fetch and order QA questions
    const qaQuestions = await prisma.questions.findMany({
        where: { question_id: { in: qaIds } }
    });
    qaQuestions.sort((a, b) => qaIds.indexOf(a.question_id) - qaIds.indexOf(b.question_id));

    // Map section abbreviation on each question
    const varcQuestionsMapped = varcQuestions.map(q => ({ ...q, section: 'VARC' }));
    const dilrQuestionsMapped = dilrQuestions.map(q => ({ ...q, section: 'DILR' }));
    const qaQuestionsMapped = qaQuestions.map(q => ({ ...q, section: 'QA' }));

    const questionsBySection = {
        'VARC': varcQuestionsMapped,
        'DILR': dilrQuestionsMapped,
        'QA': qaQuestionsMapped
    };

    const selectedQuestions = [
        ...varcQuestionsMapped,
        ...dilrQuestionsMapped,
        ...qaQuestionsMapped
    ];

    // Check if progress already exists
    let initialProgress = null;
    const progress = await prisma.testProgress.findFirst({
        where: { userId: profile.userId, year: 'Diagnostic', slot: '1' }
    });

    if (progress) {
        initialProgress = {
            answers: JSON.parse(progress.answers || '{}'),
            flagged: JSON.parse(progress.flagged || '[]'),
            timeRemaining: progress.timeRemaining,
            currentSection: progress.currentSection,
            completed: progress.completed,
            score: progress.score,
        };
    }

    return (
        <DiagnosticWrapper 
            year="Diagnostic" 
            slot="1" 
            questions={selectedQuestions} 
            questionsBySection={questionsBySection} 
            sections={sections} 
            initialProgress={initialProgress} 
        />
    );
}
