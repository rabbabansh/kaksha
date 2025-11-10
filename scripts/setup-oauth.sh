#!/bin/bash

# OAuth Setup Helper Script
# This script helps you set up Google OAuth for your CAT Prep app

echo "🔐 Google OAuth Setup Helper"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    touch .env.local
fi

# Generate NEXTAUTH_SECRET if not set
if ! grep -q "NEXTAUTH_SECRET=" .env.local || grep -q "NEXTAUTH_SECRET=your-secret" .env.local; then
    echo "🔑 Generating NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32 | tr -d '\n')
    if grep -q "NEXTAUTH_SECRET=" .env.local; then
        sed -i '' "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$SECRET/" .env.local
    else
        echo "NEXTAUTH_SECRET=$SECRET" >> .env.local
    fi
    echo "✅ Generated and saved NEXTAUTH_SECRET"
else
    echo "✅ NEXTAUTH_SECRET already exists"
fi

# Check for Google OAuth credentials
if ! grep -q "GOOGLE_CLIENT_ID=" .env.local; then
    echo ""
    echo "⚠️  Google OAuth credentials not found!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to: https://console.cloud.google.com/"
    echo "2. Create a new project (or select existing)"
    echo "3. Enable Google+ API"
    echo "4. Create OAuth 2.0 credentials:"
    echo "   - Application type: Web application"
    echo "   - Authorized redirect URI: http://localhost:3000/api/auth/callback/google"
    echo "5. Copy the Client ID and Client Secret"
    echo "6. Add them to .env.local:"
    echo ""
    echo "   GOOGLE_CLIENT_ID=your_client_id_here"
    echo "   GOOGLE_CLIENT_SECRET=your_client_secret_here"
    echo ""
    echo "📖 See OAUTH_SETUP.md for detailed instructions"
else
    echo "✅ Google OAuth credentials found"
fi

# Check NEXTAUTH_URL
if ! grep -q "NEXTAUTH_URL=" .env.local; then
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
    echo "✅ Added NEXTAUTH_URL"
else
    echo "✅ NEXTAUTH_URL already set"
fi

echo ""
echo "✅ Setup check complete!"
echo ""
echo "📝 Current .env.local contents:"
echo "---"
grep -E "GOOGLE_|NEXTAUTH_" .env.local | sed 's/=.*/=***/' || echo "No OAuth variables found"
echo "---"
echo ""
echo "🚀 After adding Google credentials, restart your dev server:"
echo "   npm run dev"


