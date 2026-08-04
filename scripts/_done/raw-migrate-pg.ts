import { Client } from 'pg';

async function main() {
  console.log('Connecting to DIRECT_URL...');
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    
    console.log('Executing CREATE TABLE for Session...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "year" TEXT,
          "slot" TEXT,
          "topic" TEXT,
          "subtopic" TEXT,
          "questionIds" TEXT NOT NULL DEFAULT '[]',
          "answers" TEXT NOT NULL DEFAULT '{}',
          "flagged" TEXT NOT NULL DEFAULT '[]',
          "timeRemaining" INTEGER,
          "currentSection" TEXT,
          "completed" BOOLEAN NOT NULL DEFAULT false,
          "score" DOUBLE PRECISION,
          "correct" INTEGER NOT NULL DEFAULT 0,
          "incorrect" INTEGER NOT NULL DEFAULT 0,
          "skipped" INTEGER NOT NULL DEFAULT 0,
          "totalQuestions" INTEGER NOT NULL DEFAULT 0,
          "timeTaken" INTEGER,
          "aiInsights" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('Creating Index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
    `);

    console.log('Creating Foreign Key...');
    try {
      await client.query(`
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('Foreign key might already exist:', (e as Error).message);
    }

    console.log('Dropping Unique Constraint on TestProgress...');
    try {
      await client.query(`
        DROP INDEX IF EXISTS "TestProgress_userId_year_slot_key";
      `);
    } catch (e) {
      console.log('Index drop failed (maybe already dropped):', (e as Error).message);
    }
    
    console.log('SQL migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
