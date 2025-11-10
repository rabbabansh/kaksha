/**
 * Script to index all questions with embeddings
 * Run this once (or whenever your data changes) to fill the vector DB
 * 
 * Usage: npx tsx scripts/runIndexing.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import prisma from '../lib/prisma';
import { embed } from '../lib/embeddingClient';
import { createFusedDocument } from '../lib/fusedDocument';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function runIndexing() {
  console.log('Starting indexing job...');
  
  // 1. Fetch all questions from the main table
  const allQuestions = await prisma.questions.findMany();

  if (allQuestions.length === 0) {
    console.log('No questions found to index. Add data to your Question table first.');
    return;
  }

  console.log(`Found ${allQuestions.length} questions to index.`);

  // 2. Loop, create fused doc, embed, and upsert
  let processed = 0;
  for (const question of allQuestions) {
    try {
      console.log(`Embedding question ${processed + 1}/${allQuestions.length}: ${question.question_id}`);

      // 3. Create the text block with ALL metadata
      const fusedDoc = createFusedDocument(question);

      // 4. Generate the 384-dimension vector
      const vector = await embed(fusedDoc);

      // 5. Save to the QuestionVector table
      // We MUST use $executeRaw for 'vector' type
      const vectorString = `[${vector.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO "QuestionVector" (id, "questionId", vector)
        VALUES (gen_random_uuid(), ${question.question_id}, ${vectorString}::vector)
        ON CONFLICT ("questionId") DO UPDATE
        SET vector = ${vectorString}::vector;
      `;

      processed++;
      
      // Log progress every 10 questions
      if (processed % 10 === 0) {
        console.log(`Progress: ${processed}/${allQuestions.length} questions indexed`);
      }
    } catch (error) {
      console.error(`Error processing question ${question.question_id}:`, error);
      // Continue with next question
    }
  }

  console.log(`✅ Indexing complete. ${processed}/${allQuestions.length} questions embedded.`);
}

runIndexing()
  .catch((error) => {
    console.error('Fatal error during indexing:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

