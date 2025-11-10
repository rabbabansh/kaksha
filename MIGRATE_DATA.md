# Database Migration Guide

This guide helps you migrate your local database data to production.

## Prerequisites

- Local database with data
- Production database URL
- `pg_dump` and `psql` installed (or use Prisma Studio)

## Method 1: Using pg_dump (Recommended for Full Migration)

### Step 1: Export Local Database

```bash
# Export schema and data
pg_dump -h localhost -U postgres -d cat_prep > local_backup.sql

# Or if using Docker
docker exec postgres-cat-prep pg_dump -U postgres cat_prep > local_backup.sql
```

### Step 2: Import to Production

```bash
# Import to production database
psql "your-production-database-url" < local_backup.sql
```

**Note**: You may need to:
- Remove `CREATE EXTENSION` statements if extension already exists
- Adjust connection string format for your provider

## Method 2: Using Prisma Studio (For Selective Migration)

### Step 1: Export Data Locally

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Manually export data from each table:
   - Questions table
   - User data (if needed)
   - Any other tables with data

### Step 2: Import to Production

1. Update `.env.local` with production `DATABASE_URL`
2. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```
3. Import data into each table

## Method 3: Using Custom Script (For Questions Only)

If you only need to migrate questions:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migration script
npx tsx scripts/migrate-questions.ts
```

## Important Notes

### Vector Data

⚠️ **Vector embeddings are NOT migrated automatically!**

After migrating questions, you MUST regenerate embeddings:

```bash
# Point to production database
export DATABASE_URL="your-production-database-url"

# Run indexing
npx tsx scripts/runIndexing.ts
```

This will:
1. Read all questions from production database
2. Generate embeddings using Transformers.js
3. Store vectors in the `QuestionVector` table

### User Data

- **Do NOT migrate user data** from development to production
- Users should sign up fresh in production
- If you need test users, create them manually in production

### Test Progress Data

- Test progress is user-specific
- Should not be migrated (users will start fresh)

## Verification

After migration, verify:

1. **Questions count:**
   ```sql
   SELECT COUNT(*) FROM questions;
   ```

2. **Vectors count:**
   ```sql
   SELECT COUNT(*) FROM "QuestionVector";
   ```

3. **Schema:**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

4. **Run verification script:**
   ```bash
   export DATABASE_URL="your-production-database-url"
   npx tsx scripts/verify-setup.ts
   ```

## Troubleshooting

### Connection Issues

- Ensure production database allows connections from your IP
- Check SSL requirements (add `?sslmode=require` if needed)
- Verify credentials are correct

### Extension Errors

If you see errors about `vector` extension:
- Ensure pgvector is enabled in production database
- Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### Foreign Key Errors

If you see foreign key constraint errors:
- Migrate tables in order: questions first, then QuestionVector
- Or disable foreign key checks temporarily (not recommended)

## Production Database Setup Checklist

- [ ] Database created
- [ ] pgvector extension enabled
- [ ] Prisma migrations run
- [ ] Questions data migrated
- [ ] Embeddings generated (runIndexing.ts)
- [ ] Verification script passes
- [ ] Test connection from application

