/**
 * Comprehensive setup verification script
 * 
 * Usage: npx tsx scripts/verify-setup.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import prisma from '../lib/prisma';
import { searchQuestionsBySubtopic, getQuestionMetadata } from '../lib/embeddings';
import { embed } from '../lib/embeddingClient';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function verifySetup() {
  console.log('🔍 Verifying Complete Setup...\n');
  const errors: string[] = [];
  const warnings: string[] = [];

  // Test 1: Database Connection
  console.log('1. Testing database connection...');
  try {
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
  } catch (error: any) {
    errors.push(`Database connection failed: ${error.message}`);
    console.log('   ❌ Database connection failed');
    return;
  }

  // Test 2: Questions Count
  console.log('\n2. Checking questions in database...');
  try {
    const questionCount = await prisma.questions.count();
    if (questionCount === 0) {
      warnings.push('No questions found in database');
      console.log('   ⚠️  No questions found');
    } else {
      console.log(`   ✅ Found ${questionCount} questions`);
    }
  } catch (error: any) {
    errors.push(`Failed to count questions: ${error.message}`);
    console.log('   ❌ Failed to count questions');
  }

  // Test 3: Vectors Count
  console.log('\n3. Checking vector embeddings...');
  try {
    const vectorCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "QuestionVector"
    `;
    const count = Number(vectorCount[0]?.count || 0);
    if (count === 0) {
      warnings.push('No vectors found - run indexing script');
      console.log('   ⚠️  No vectors found');
    } else {
      console.log(`   ✅ Found ${count} vector embeddings`);
    }
  } catch (error: any) {
    errors.push(`Failed to count vectors: ${error.message}`);
    console.log('   ❌ Failed to count vectors');
  }

  // Test 4: Vector Extension
  console.log('\n4. Checking PGVector extension...');
  try {
    const extension = await prisma.$queryRaw<Array<{ extname: string; extversion: string }>>`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'
    `;
    if (extension.length === 0) {
      errors.push('PGVector extension not installed');
      console.log('   ❌ PGVector extension not found');
    } else {
      console.log(`   ✅ PGVector extension installed (version: ${extension[0].extversion})`);
    }
  } catch (error: any) {
    errors.push(`Failed to check extension: ${error.message}`);
    console.log('   ❌ Failed to check extension');
  }

  // Test 5: Embedding Model
  console.log('\n5. Testing embedding model...');
  try {
    const testEmbedding = await embed('test query');
    if (testEmbedding.length === 384) {
      console.log(`   ✅ Embedding model working (${testEmbedding.length} dimensions)`);
    } else {
      errors.push(`Unexpected embedding dimension: ${testEmbedding.length} (expected 384)`);
      console.log(`   ❌ Unexpected embedding dimension: ${testEmbedding.length}`);
    }
  } catch (error: any) {
    errors.push(`Embedding model failed: ${error.message}`);
    console.log('   ❌ Embedding model failed');
  }

  // Test 6: Vector Search
  console.log('\n6. Testing vector search...');
  try {
    const results = await searchQuestionsBySubtopic('Algebra', undefined, undefined, [], 3);
    if (results.length > 0) {
      console.log(`   ✅ Vector search working (found ${results.length} results)`);
    } else {
      warnings.push('Vector search returned no results (may be normal if no matching questions)');
      console.log('   ⚠️  Vector search returned no results');
    }
  } catch (error: any) {
    errors.push(`Vector search failed: ${error.message}`);
    console.log('   ❌ Vector search failed');
  }

  // Test 7: Question Metadata
  console.log('\n7. Testing question metadata retrieval...');
  try {
    const metadata = await getQuestionMetadata();
    const sections = Object.keys(metadata.sections || {});
    if (sections.length > 0) {
      console.log(`   ✅ Metadata retrieval working (${sections.length} sections found)`);
    } else {
      warnings.push('No sections found in metadata');
      console.log('   ⚠️  No sections found');
    }
  } catch (error: any) {
    errors.push(`Metadata retrieval failed: ${error.message}`);
    console.log('   ❌ Metadata retrieval failed');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All checks passed! System is fully operational.\n');
  } else {
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
    }
    console.log('');
  }

  await prisma.$disconnect();
  process.exit(errors.length > 0 ? 1 : 0);
}

verifySetup().catch((error) => {
  console.error('Fatal error during verification:', error);
  process.exit(1);
});

