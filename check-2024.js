require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const qs = await prisma.questions.findMany({
    where: { year: '2024', slot: '1' },
    select: { question_id: true, explanation_html: true }
  });
  
  console.log(`Total questions for 2024 Slot 1: ${qs.length}`);
  
  const withExpl = qs.filter(q => q.explanation_html && q.explanation_html !== 'N/A' && q.explanation_html.trim() !== '');
  console.log(`Questions with explanations: ${withExpl.length}`);
  
  const withoutExpl = qs.filter(q => !q.explanation_html || q.explanation_html === 'N/A' || q.explanation_html.trim() === '');
  console.log(`Questions without explanations: ${withoutExpl.length}`);
  
  if (withoutExpl.length > 0) {
    console.log('Sample question ID without explanation:', withoutExpl[0].question_id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
