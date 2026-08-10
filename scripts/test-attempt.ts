import prisma from '../lib/prisma';
async function main() {
  const q = await prisma.questions.findFirst();
  console.log("Testing with question:", q.question_id);
  
  const res = await fetch('http://localhost:3000/api/progress/attempt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId: q.question_id,
      userAnswer: q.answer || 'A',
      source: 'practice'
    })
  });
  console.log("Response:", await res.text());
}
main();
