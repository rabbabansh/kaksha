#!/bin/bash
# Quick verification script
# Usage: ./verify-import.sh "postgresql://user:password@host:5432/database?sslmode=require"

if [ -z "$1" ]; then
  echo "Usage: ./verify-import.sh \"postgresql://user:password@host:5432/database?sslmode=require\""
  exit 1
fi

echo "🔍 Verifying database import..."
echo ""

# Check if tables exist
echo "📊 Checking tables..."
psql "$1" -c "\dt" | grep -E "(questions|User|QuestionVector|TestProgress|QuestionAttempt|UserProgress|UserProfile)" || echo "⚠️  Some tables may be missing"

echo ""
echo "📈 Checking row counts..."
psql "$1" -c "
SELECT 
  'questions' as table_name, COUNT(*) as row_count FROM questions
UNION ALL
SELECT 'User', COUNT(*) FROM \"User\"
UNION ALL
SELECT 'QuestionVector', COUNT(*) FROM \"QuestionVector\"
UNION ALL
SELECT 'TestProgress', COUNT(*) FROM \"TestProgress\"
UNION ALL
SELECT 'QuestionAttempt', COUNT(*) FROM \"QuestionAttempt\"
UNION ALL
SELECT 'UserProgress', COUNT(*) FROM \"UserProgress\"
UNION ALL
SELECT 'UserProfile', COUNT(*) FROM \"UserProfile\";
"

echo ""
echo "✅ Verification complete!"
