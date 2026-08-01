import prisma from './lib/prisma';

async function main() {
  console.log('Cleaning questions table...');
  const questions = await prisma.questions.findMany({ select: { question_id: true, topic: true, subtopic: true } });
  
  let qUpdated = 0;
  for (const q of questions) {
    const newTopic = q.topic?.replace(/\s*-\s*$/, '')?.trim();
    const newSubtopic = q.subtopic?.replace(/\s*-\s*$/, '')?.trim();
    
    if (newTopic !== q.topic || newSubtopic !== q.subtopic) {
      await prisma.questions.update({
        where: { question_id: q.question_id },
        data: { topic: newTopic, subtopic: newSubtopic }
      });
      qUpdated++;
    }
  }
  console.log(`Updated ${qUpdated} questions.`);

  console.log('Cleaning UserProgress table...');
  const progress = await prisma.userProgress.findMany();
  
  let pUpdated = 0;
  for (const p of progress) {
    const newTopic = p.topic?.replace(/\s*-\s*$/, '')?.trim();
    const newSubtopic = p.subtopic?.replace(/\s*-\s*$/, '')?.trim();
    
    if (newTopic !== p.topic || newSubtopic !== p.subtopic) {
      // Because there is a unique constraint on [userId, section, topic, subtopic],
      // updating it directly might clash if the trimmed version already exists.
      // Let's handle potential clashes by catching errors and deleting the old one if needed,
      // or just update if no clash.
      try {
        await prisma.userProgress.update({
          where: { id: p.id },
          data: { topic: newTopic, subtopic: newSubtopic }
        });
        pUpdated++;
      } catch (e) {
        console.warn(`Could not update UserProgress ${p.id}, it might already exist. Deleting duplicate.`);
        await prisma.userProgress.delete({ where: { id: p.id } });
      }
    }
  }
  console.log(`Updated ${pUpdated} UserProgress records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
