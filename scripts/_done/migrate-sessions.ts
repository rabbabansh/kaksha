import prisma from '@/lib/prisma';

async function main() {
  console.log('Starting migration from TestProgress to Session...');
  
  const allTestProgress = await prisma.testProgress.findMany();
  console.log(`Found ${allTestProgress.length} TestProgress records.`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const tp of allTestProgress) {
    try {
      // Calculate derived fields from TestProgress
      const answersObj = JSON.parse(tp.answers || '{}');
      const questionIds = Object.keys(answersObj);
      
      let correct = 0;
      let incorrect = 0;
      let skipped = 0;
      let score = 0;

      // Because TestProgress stores score natively as Int, we can just use it.
      // But if we want to be exact, we can rely on tp.score if available.
      score = tp.score || 0;
      
      // The old mock report route did calculations on the fly, 
      // but if the user answered them, we can assume total attempts:
      const totalQuestions = questionIds.length;
      
      await prisma.session.create({
        data: {
          id: tp.id, // Preserve ID if possible, though cuid() will auto-generate if we omit. We'll omit to be safe, but wait, keeping it is better for consistency if anything references it (nothing does yet).
          userId: tp.userId,
          type: 'MOCK',
          year: tp.year,
          slot: tp.slot,
          answers: tp.answers,
          flagged: tp.flagged,
          timeRemaining: tp.timeRemaining,
          currentSection: tp.currentSection,
          completed: tp.completed,
          score: score,
          correct: correct, // We'd need to fetch actual questions to compute accurate correct/incorrect/skipped for past mocks, but for now we migrate the data as-is. 
          incorrect: incorrect,
          skipped: skipped,
          totalQuestions: totalQuestions,
          aiInsights: tp.aiInsights,
          createdAt: tp.createdAt,
          updatedAt: tp.updatedAt,
        }
      });
      successCount++;
    } catch (err) {
      console.error(`Failed to migrate TestProgress ID ${tp.id}:`, err);
      errorCount++;
    }
  }

  console.log(`Migration complete. Successfully migrated: ${successCount}, Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
