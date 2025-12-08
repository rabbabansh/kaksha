#!/bin/bash
# Quick script to test database connection
# Usage: ./test-db-connection.sh

echo "🔍 Testing database connection..."
echo ""

# Load .env.local if it exists
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in environment"
  echo "Make sure .env.local exists and contains DATABASE_URL"
  exit 1
fi

echo "📋 Connection string format: ${DATABASE_URL:0:50}..."
echo ""

# Test with Prisma
echo "Testing with Prisma..."
npx prisma db pull --force 2>&1 | head -20

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo ""
  echo "✅ Database connection successful!"
else
  echo ""
  echo "❌ Database connection failed!"
  echo ""
  echo "Common fixes:"
  echo "1. Get a new API key from https://console.prisma.io/"
  echo "2. Update DATABASE_URL in .env.local"
  echo "3. Make sure the API key is valid and not expired"
fi
