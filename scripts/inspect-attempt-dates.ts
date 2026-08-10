import prisma from '../lib/prisma';
async function main() {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId: 'cmhph5juc0000ojip18s5q667' },
    orderBy: { attemptedAt: 'asc' },
    take: 1
  });
  const lastAttempts = await prisma.questionAttempt.findMany({
    where: { userId: 'cmhph5juc0000ojip18s5q667' },
    orderBy: { attemptedAt: 'desc' },
    take: 1
  });
  console.log("First attempt date:", attempts[0]?.attemptedAt);
  console.log("Last attempt date:", lastAttempts[0]?.attemptedAt);
}
main();
