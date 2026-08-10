import prisma from '../lib/prisma';
async function main() {
  const userId = 'cmhph5juc0000ojip18s5q667';
  const attempts = await prisma.questionAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      include: {
        question: {
          select: { topic: true, subtopic: true, section: true, source: true }
        }
      }
  });
  
  const mockProgress = await prisma.session.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
  });
  
  const practiceHistory = (() => {
    if (!attempts) return [];
    const grouped = attempts.reduce((acc: any, curr: any) => {
      const key = curr.question?.subtopic;
      if (!key) return acc;
      const localDateStr = new Date(curr.attemptedAt).toLocaleDateString();
      const groupKey = `${key}_${localDateStr}`;
      if (!acc[groupKey]) {
        acc[groupKey] = { subtopic: key, count: 0, date: localDateStr, timestamp: new Date(curr.attemptedAt).getTime(), topic: curr.question.topic, source: curr.source };
      }
      acc[groupKey].count++;
      return acc;
    }, {});
    return Object.values(grouped);
  })();
  
  console.log("Practice Groups:", practiceHistory.length);
  console.log("Mocks:", mockProgress.length);
}
main();
