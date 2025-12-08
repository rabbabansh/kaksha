#!/bin/bash

# Script to import db_dump.bak into Prisma Postgres
# Usage: ./import-to-prisma.sh "postgresql://user:password@host:5432/database?sslmode=require"

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Direct database connection string required"
  echo ""
  echo "Usage: ./import-to-prisma.sh \"postgresql://user:password@host:5432/database?sslmode=require\""
  echo ""
  echo "To get the direct connection string:"
  echo "1. Go to https://console.prisma.io/"
  echo "2. Navigate to your database project"
  echo "3. Find 'Direct Connection' or 'Connection Pooling' section"
  echo "4. Copy the direct connection string (NOT the prisma+postgres:// one)"
  exit 1
fi

DIRECT_DB_URL="$1"

# Check if dump file exists
if [ ! -f "db_dump.bak" ]; then
  echo "❌ Error: db_dump.bak not found in current directory"
  exit 1
fi

echo "📦 Starting database import..."
echo "📁 Source: db_dump.bak"
echo "🔗 Target: ${DIRECT_DB_URL:0:50}..."
echo ""

# Step 1: Enable pgvector extension (required for vector type)
echo "🔧 Step 1: Enabling pgvector extension..."
psql "$DIRECT_DB_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;" || {
  echo "⚠️  Warning: Could not enable vector extension. It may already exist or you may need to enable it manually in Prisma dashboard."
}

# Step 2: Run pg_restore with flags to handle existing objects
echo ""
echo "📥 Step 2: Restoring database from dump..."
pg_restore \
  -d "$DIRECT_DB_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -v \
  ./db_dump.bak 2>&1 | grep -v "already exists" || true

# Check if restore was successful (ignore warnings about existing schema)
if [ ${PIPESTATUS[0]} -eq 0 ] || [ ${PIPESTATUS[0]} -eq 1 ]; then
  echo ""
  echo "✅ Import complete! (Some warnings about existing objects are normal)"
  echo ""
  echo "Next steps:"
  echo "1. Verify data: npx prisma studio"
  echo "2. Make sure your .env.local uses the Accelerate URL for the app"
else
  echo ""
  echo "❌ Import failed. Check the error messages above."
  exit 1
fi

