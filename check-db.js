const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const q2024 = await prisma.questions.findMany({
    where: { year: '2024' },
    select: { question_id: true, explanation_html: true, section: true, topic: true, subtopic: true }
  });
  console.log(`Found ${q2024.length} questions for 2024`);
  const withExpl = q2024.filter(q => q.explanation_html && q.explanation_html !== 'N/A' && q.explanation_html.trim() !== '');
  console.log(`Questions with explanation: ${withExpl.length}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
