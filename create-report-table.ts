import prisma from './lib/prisma';

async function main() {
  try {
    console.log('Creating ReportedQuestion table...');
    
    // Check if table exists first (optional, but good practice)
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "ReportedQuestion" (
          "id" TEXT NOT NULL,
          "questionId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "reason" TEXT NOT NULL,
          "details" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          
          CONSTRAINT "ReportedQuestion_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ReportedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ReportedQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      console.log('Table created successfully!');
    } catch (e: any) {
      console.log('Error or table already exists:', e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX "ReportedQuestion_questionId_idx" ON "ReportedQuestion"("questionId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "ReportedQuestion_userId_idx" ON "ReportedQuestion"("userId");`);
      console.log('Indexes created successfully!');
    } catch (e: any) {
      console.log('Indexes error:', e.message);
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

main();
