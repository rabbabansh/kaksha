# Embeddings Setup Guide

This guide will help you set up PostgreSQL with PGVector and local embeddings using Transformers.js.

## Overview

This setup uses:
- **PostgreSQL** with **PGVector** extension for vector storage
- **Transformers.js** with **Xenova/all-MiniLM-L6-v2** model for local embeddings (384 dimensions)
- **Fused documents** that combine all question metadata for better semantic search

## Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** and npm installed
3. All npm dependencies installed (`npm install`)

## Step 1: Install PostgreSQL

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run -d \
  --name postgres-cat-prep \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=cat_prep \
  postgres:15

# Install pgvector extension in the container
docker exec postgres-cat-prep bash -c "apt-get update && apt-get install -y postgresql-15-pgvector"

# Restart container to load the extension
docker restart postgres-cat-prep
```

**Note**: If you already have a PostgreSQL container running, you can install pgvector in it using the second command above.

### Option B: Install Locally

- **macOS**: `brew install postgresql@15`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/cat_prep"
```

**Note**: Update the connection string with your actual PostgreSQL credentials.

## Step 3: Enable PGVector Extension

Run this command to enable the vector extension in PostgreSQL:

**Option 1: Using Prisma with environment variable:**
```bash
# Load .env.local and run the command
export $(cat .env.local | grep DATABASE_URL | xargs)
echo "CREATE EXTENSION IF NOT EXISTS vector;" > /tmp/enable_vector.sql
npx prisma db execute --file /tmp/enable_vector.sql --schema prisma/schema.prisma
```

**Option 2: Using Prisma with --url flag (recommended):**
```bash
# Create SQL file
echo "CREATE EXTENSION IF NOT EXISTS vector;" > /tmp/enable_vector.sql

# Get DATABASE_URL from .env.local and pass it directly
DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
npx prisma db execute --file /tmp/enable_vector.sql --schema prisma/schema.prisma --url "$DATABASE_URL"
```

**Option 3: Using psql directly (simplest):**
If you have `psql` installed:
```bash
# Load DATABASE_URL from .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## Step 4: Push Database Schema

Sync your Prisma schema with the database:

```bash
npx prisma db push
```

This will:
- Create all tables (questions, User, QuestionVector, etc.)
- Set up the vector column in QuestionVector table

## Step 5: Migrate Your Questions Data

If you have questions in SQLite, you'll need to migrate them to PostgreSQL. You can:

1. **Export from SQLite** and import to PostgreSQL
2. **Use Prisma Migrate** to set up the schema first, then import data
3. **Write a migration script** to copy data

Example migration script approach:

```typescript
// scripts/migrate-questions.ts
import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const sqlite = new Database('./prisma/master_cat_questions.db');
const prisma = new PrismaClient();

// Read from SQLite and write to PostgreSQL
const questions = sqlite.prepare('SELECT * FROM questions').all();

for (const q of questions) {
  await prisma.questions.create({
    data: {
      question_id: q.question_id,
      set_id: q.set_id,
      source: q.source,
      year: q.year,
      slot: q.slot,
      section: q.section,
      topic: q.topic,
      subtopic: q.subtopic,
      set_html: q.set_html,
      question_html: q.question_html,
      question_type: q.question_type,
      option_a_html: q.option_a_html,
      option_b_html: q.option_b_html,
      option_c_html: q.option_c_html,
      option_d_html: q.option_d_html,
      option_e_html: q.option_e_html,
      answer: q.answer,
      explanation_html: q.explanation_html,
      video_explanation_link: q.video_explanation_link,
    },
  });
}
```

## Step 6: Initialize Embeddings

Once your questions are in PostgreSQL, run the indexing script:

```bash
npx tsx scripts/runIndexing.ts
```

**What this does:**
1. Loads the local embedding model (first run will download ~90MB model)
2. Processes all questions from the database
3. Creates a "fused document" with all metadata for each question
4. Generates 384-dimension vectors using the local model
5. Stores vectors in the `QuestionVector` table

**First run notes:**
- The model download happens automatically on first use
- This may take 10-30 minutes depending on your question count
- Progress is logged every 10 questions

## Step 7: Verify Setup

Test the search functionality:

```bash
# Test search via API (if your app is running)
curl http://localhost:3000/api/questions/search?subtopic=Algebra
```

Or test directly in your chat interface - the AI should now use vector search to find relevant questions.

## How It Works

### Fused Document Creation

Each question is converted into a rich text document that includes:
- Topic, Subtopic, Section, Difficulty
- Year and Slot information
- Full question text (HTML)
- All answer options
- Correct answer
- Explanation

This ensures the embedding captures all relevant context for better semantic search.

### Vector Search

When searching:
1. User query is embedded using the same model
2. PostgreSQL performs cosine similarity search (`<=>` operator)
3. Top K most similar questions are returned
4. Results are ordered by relevance

### Local Embeddings

- **Model**: `Xenova/all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Advantages**: 
  - No API costs
  - No rate limits
  - Works offline
  - Fast inference
- **First load**: Downloads model (~90MB) and caches it locally

## Troubleshooting

### Error: "extension vector does not exist"

Run:
```bash
echo "CREATE EXTENSION IF NOT EXISTS vector;" > /tmp/enable_vector.sql
npx prisma db execute --file /tmp/enable_vector.sql --schema prisma/schema.prisma
```

Or use psql directly:
```bash
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Error: "relation QuestionVector does not exist"

Run: `npx prisma db push` to sync schema

### Error: "Cannot connect to PostgreSQL"

1. Check if PostgreSQL is running: `docker ps` (if using Docker) or `pg_isready`
2. Verify `DATABASE_URL` in `.env.local`
3. Test connection: `psql $DATABASE_URL`

### Model download is slow

The model is downloaded on first use. It's cached in `~/.cache/huggingface/` for future use.

### Out of memory during indexing

Process questions in smaller batches by modifying `scripts/runIndexing.ts` to add delays or process in chunks.

## Maintenance

### Re-indexing

If you add new questions, run the indexing script again:

```bash
npx tsx scripts/runIndexing.ts
```

The script uses `ON CONFLICT` to update existing vectors, so it's safe to run multiple times.

### Checking Index Status

```sql
-- Count indexed questions
SELECT COUNT(*) FROM "QuestionVector";

-- Compare with total questions
SELECT COUNT(*) FROM questions;
```

## Next Steps

- The chat API will automatically use vector search when subtopics are provided
- The AI can now find semantically similar questions even if exact keywords don't match
- Progress tracking and adaptive learning will benefit from better question retrieval

