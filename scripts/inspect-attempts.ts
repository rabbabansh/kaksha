import prisma from '../lib/prisma';
async function main() {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId: 'cmhph5juc0000ojip18s5q667' }
  });
  console.log("Total attempts:", attempts.length);
}
main();
