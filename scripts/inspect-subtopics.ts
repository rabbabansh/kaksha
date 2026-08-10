import prisma from '../lib/prisma';
async function main() {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId: 'cmhph5juc0000ojip18s5q667' },
    include: { question: true }
  });
  const nullSubtopics = attempts.filter(a => !a.question?.subtopic).length;
  console.log(`Attempts with null subtopic: ${nullSubtopics}`);
}
main();
