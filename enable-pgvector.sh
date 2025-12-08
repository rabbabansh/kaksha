#!/bin/bash
# Quick script to enable pgvector extension
# Usage: ./enable-pgvector.sh "postgresql://user:password@host:5432/database?sslmode=require"

if [ -z "$1" ]; then
  echo "Usage: ./enable-pgvector.sh \"postgresql://user:password@host:5432/database?sslmode=require\""
  exit 1
fi

echo "Enabling pgvector extension..."
psql "$1" -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo "✅ pgvector extension enabled!"
