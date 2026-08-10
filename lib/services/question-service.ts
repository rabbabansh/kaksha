import prisma from '@/lib/prisma';

export async function getUserAttempts(userId: string) {
  return await prisma.questionAttempt.findMany({
    where: { userId },
    orderBy: { attemptedAt: 'desc' },
  });
}

export async function getQuestionWithContext(questionId: string) {
  const question = await prisma.questions.findUnique({
    where: { question_id: questionId },
  });
  
  if (!question) {
    return null;
  }
  
  let setQuestions: any[] = [];
  if (question.set_id) {
    setQuestions = await prisma.questions.findMany({
      where: { set_id: question.set_id },
      orderBy: { question_id: 'asc' },
    });
  }
  
  return {
    question,
    setQuestions
  };
}
