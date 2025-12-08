#!/bin/bash
# Script to help fix invalid Prisma Accelerate API key

echo "🔧 Fixing Invalid Prisma Accelerate API Key"
echo "==========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found!"
  echo "Creating .env.local template..."
  cat > .env.local << 'ENVEOF'
# Database Connection
# Option 1: Use Prisma Accelerate (get from https://console.prisma.io/)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY_HERE"

# Option 2: Use Direct Connection (temporary workaround)
# DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Add other required variables...
ENVEOF
  echo "✅ Created .env.local template"
  echo ""
  echo "⚠️  Please edit .env.local and add your database connection string"
  exit 1
fi

echo "Current DATABASE_URL format:"
CURRENT_URL=$(grep "^DATABASE_URL" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [[ "$CURRENT_URL" == prisma+postgres* ]]; then
  echo "  Format: Prisma Accelerate"
  echo "  URL: ${CURRENT_URL:0:60}..."
  echo ""
  echo "❌ The API key appears to be invalid!"
  echo ""
  echo "🔧 To fix this:"
  echo ""
  echo "Option 1: Get a new Prisma Accelerate API key"
  echo "  1. Go to https://console.prisma.io/"
  echo "  2. Navigate to your database project"
  echo "  3. Go to Connection Strings → Prisma Accelerate"
  echo "  4. Copy the new connection string"
  echo "  5. Update DATABASE_URL in .env.local"
  echo ""
  echo "Option 2: Use Direct Connection (temporary)"
  echo "  1. Get direct connection string from Prisma dashboard"
  echo "  2. Update DATABASE_URL in .env.local to:"
  echo "     DATABASE_URL=\"postgresql://user:password@host:5432/database?sslmode=require\""
  echo ""
  echo "After updating, restart your server:"
  echo "  npm run dev    # for development"
  echo "  npm start      # for production"
else
  echo "  Format: Direct Connection"
  echo "  URL: ${CURRENT_URL:0:60}..."
  echo ""
  echo "✅ Using direct connection (should work)"
  echo "  If you still get errors, check:"
  echo "  - Connection string is correct"
  echo "  - Database is accessible"
  echo "  - SSL mode is correct"
fi

