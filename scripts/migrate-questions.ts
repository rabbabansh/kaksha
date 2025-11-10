/**
 * Script to migrate questions from SQLite to PostgreSQL
 * 
 * Usage: npx tsx scripts/migrate-questions.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Database from 'better-sqlite3';
import prisma from '../lib/prisma';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SQLITE_DB_PATH = './prisma/master_cat_questions.db';

async function migrateQuestions() {
  console.log('Starting migration from SQLite to PostgreSQL...\n');

  // Check if SQLite database exists
  try {
    const sqlite = new Database(SQLITE_DB_PATH, { readonly: true });
    console.log('✅ Connected to SQLite database\n');

    // Get all questions from SQLite
    const questions = sqlite.prepare('SELECT * FROM questions').all() as any[];
    console.log(`Found ${questions.length} questions in SQLite database\n`);

    if (questions.length === 0) {
      console.log('No questions to migrate.');
      sqlite.close();
      return;
    }

    // Check how many already exist in PostgreSQL
    const existingCount = await prisma.questions.count();
    console.log(`Current questions in PostgreSQL: ${existingCount}\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Process questions in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(questions.length / BATCH_SIZE);

      console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} questions)...`);

      for (const q of batch) {
        try {
          // Check if question already exists
          const existing = await prisma.questions.findUnique({
            where: { question_id: q.question_id },
          });

          if (existing) {
            skipped++;
            continue;
          }

          // Insert question into PostgreSQL
          await prisma.questions.create({
            data: {
              question_id: q.question_id,
              set_id: q.set_id || null,
              source: q.source || null,
              year: q.year || null,
              slot: q.slot || null,
              section: q.section || null,
              topic: q.topic || null,
              subtopic: q.subtopic || null,
              set_html: q.set_html || null,
              question_html: q.question_html || null,
              question_type: q.question_type || null,
              option_a_html: q.option_a_html || null,
              option_b_html: q.option_b_html || null,
              option_c_html: q.option_c_html || null,
              option_d_html: q.option_d_html || null,
              option_e_html: q.option_e_html || null,
              answer: q.answer || null,
              explanation_html: q.explanation_html || null,
              video_explanation_link: q.video_explanation_link || null,
            },
          });

          migrated++;
        } catch (error: any) {
          errors++;
          console.error(`Error migrating question ${q.question_id}:`, error.message);
        }
      }

      // Progress update
      const progress = ((i + batch.length) / questions.length) * 100;
      console.log(`  Progress: ${(i + batch.length)}/${questions.length} (${progress.toFixed(1)}%)`);
      console.log(`  Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}\n`);
    }

    sqlite.close();

    console.log('\n✅ Migration complete!');
    console.log(`   Total questions: ${questions.length}`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped (already exist): ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   New total in PostgreSQL: ${existingCount + migrated}`);
  } catch (error: any) {
    console.error('❌ Error during migration:', error.message);
    if (error.message.includes('no such file')) {
      console.error(`   SQLite database not found at: ${SQLITE_DB_PATH}`);
      console.error('   Please check the path to your SQLite database.');
    }
    process.exit(1);
  }
}

migrateQuestions()
  .catch((error) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

