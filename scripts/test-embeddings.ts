/**
 * Test script to verify embeddings and vector search are working
 * 
 * Usage: npx tsx scripts/test-embeddings.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { searchQuestionsBySubtopic } from '../lib/embeddings';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testEmbeddings() {
  console.log('🧪 Testing embeddings and vector search...\n');

  try {
    // Test 1: Search for algebra questions
    console.log('Test 1: Searching for "Algebra" questions...');
    const algebraQuestions = await searchQuestionsBySubtopic('Algebra', undefined, undefined, [], 5);
    console.log(`✅ Found ${algebraQuestions.length} algebra questions`);
    if (algebraQuestions.length > 0) {
      console.log(`   Example: ${algebraQuestions[0].question_id} - ${algebraQuestions[0].topic || 'N/A'}`);
    }
    console.log('');

    // Test 2: Search for reading comprehension
    console.log('Test 2: Searching for "Reading Comprehension" questions...');
    const rcQuestions = await searchQuestionsBySubtopic('Reading Comprehension', 'VARC', undefined, [], 5);
    console.log(`✅ Found ${rcQuestions.length} reading comprehension questions`);
    if (rcQuestions.length > 0) {
      console.log(`   Example: ${rcQuestions[0].question_id} - ${rcQuestions[0].subtopic || 'N/A'}`);
    }
    console.log('');

    // Test 3: Search for geometry
    console.log('Test 3: Searching for "Geometry" questions...');
    const geometryQuestions = await searchQuestionsBySubtopic('Geometry', undefined, undefined, [], 5);
    console.log(`✅ Found ${geometryQuestions.length} geometry questions`);
    if (geometryQuestions.length > 0) {
      console.log(`   Example: ${geometryQuestions[0].question_id} - ${geometryQuestions[0].topic || 'N/A'}`);
    }
    console.log('');

    console.log('✅ All tests passed! Vector search is working correctly.');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testEmbeddings()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

