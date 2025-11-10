/**
 * Script to index questions with embeddings in production
 * 
 * Usage:
 *   DATABASE_URL="your-production-db-url" npx tsx scripts/index-production.ts
 * 
 * Or set DATABASE_URL in your environment and run:
 *   npx tsx scripts/index-production.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import prisma from '../lib/prisma';
import { embed } from '../lib/embeddingClient';
import { createFusedDocument } from '../lib/fusedDocument';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Allow DATABASE_URL from environment to override .env.local
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL from environment');
}

async function indexProduction() {
  console.log('🚀 Starting production indexing...');
  console.log('⚠️  Make sure DATABASE_URL points to your production database!');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set!');
    console.error('Set it as: DATABASE_URL="your-db-url" npx tsx scripts/index-production.ts');
    process.exit(1);
  }

  // Warn if it looks like a local database
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    console.warn('⚠️  WARNING: DATABASE_URL appears to be local!');
    console.warn('Are you sure you want to index the local database?');
    console.warn('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Count existing questions
    const totalQuestions = await prisma.questions.count();
    console.log(`📊 Found ${totalQuestions} questions in database`);

    if (totalQuestions === 0) {
      console.error('❌ No questions found in database!');
      console.error('Make sure you have migrated your questions data first.');
      process.exit(1);
    }

    // Count existing vectors
    const existingVectors = await prisma.questionVector.count();
    console.log(`📊 Found ${existingVectors} existing vectors`);

    if (existingVectors > 0) {
      console.log('⚠️  WARNING: Vectors already exist!');
      console.log('This will update existing vectors. Continue? (Ctrl+C to cancel)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Get all questions
    console.log('📥 Fetching questions...');
    const questions = await prisma.questions.findMany({
      include: {
        vector: true, // Include existing vector if any
      },
    });

    console.log(`📝 Processing ${questions.length} questions...`);

    let processed = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const question of questions) {
      try {
        // Create fused document
        const fusedDoc = createFusedDocument(question);
        
        // Generate embedding
        const embedding = await embed(fusedDoc);
        
        // Upsert vector using raw SQL (Prisma doesn't support vector type directly)
        const vectorString = `[${embedding.join(',')}]`;
        await prisma.$executeRaw`
          INSERT INTO "QuestionVector" ("id", "questionId", vector)
          VALUES (gen_random_uuid(), ${question.question_id}, ${vectorString}::vector)
          ON CONFLICT ("questionId") 
          DO UPDATE SET vector = ${vectorString}::vector
        `;
        
        if (question.vector) {
          updated++;
        } else {
          created++;
        }

        processed++;
        
        if (processed % 100 === 0) {
          console.log(`⏳ Processed ${processed}/${questions.length} questions...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing question ${question.question_id}:`, error);
        // Continue with next question
      }
    }

    console.log('\n✅ Indexing complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total questions: ${totalQuestions}`);
    console.log(`   - Processed: ${processed}`);
    console.log(`   - Created: ${created}`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Errors: ${errors}`);

    // Verify final count
    const finalVectorCount = await prisma.questionVector.count();
    console.log(`\n🔍 Verification: ${finalVectorCount} vectors in database`);

    if (finalVectorCount !== totalQuestions) {
      console.warn(`⚠️  WARNING: Vector count (${finalVectorCount}) doesn't match question count (${totalQuestions})`);
    } else {
      console.log('✅ All questions have vectors!');
    }

  } catch (error) {
    console.error('❌ Fatal error during indexing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database');
  }
}

// Run the script
indexProduction().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

