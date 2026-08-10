import prisma from '../lib/prisma';
async function main() {
  const qa = await prisma.questionAttempt.findMany({ include: { question: true }});
  console.log("Total QA:", qa.length);
  const byUser = qa.reduce((acc, curr) => {
    acc[curr.userId] = (acc[curr.userId] || 0) + 1;
    return acc;
  }, {});
  console.log("By User:", byUser);
  const missingQuestion = qa.filter(q => !q.question).length;
  console.log("Missing question relation:", missingQuestion);
}
main();
