import prisma from '../lib/prisma';
async function main() {
  const tp = await prisma.testProgress.findMany();
  console.log("TestProgress count:", tp.length);
  const up = await prisma.userProgress.findMany();
  console.log("UserProgress count:", up.length);
  const qa = await prisma.questionAttempt.findMany();
  console.log("QuestionAttempt count:", qa.length);
  const s = await prisma.session.findMany();
  console.log("Session count:", s.length);
}
main();
