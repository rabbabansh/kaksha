# Deployment Guide for CAT Prep UI

This guide will help you deploy your CAT Prep application to Vercel and set up a production PostgreSQL database.

## Overview

Your application requires:
- **Next.js App** → Deploy to Vercel
- **PostgreSQL Database** → Deploy to Neon or Supabase (recommended for pgvector support)
- **Environment Variables** → Configure in Vercel dashboard

## Step 1: Set Up Production Database

### Option A: Neon (Recommended - Best pgvector Support)

1. **Sign up at [Neon](https://neon.tech)**
   - Create a free account
   - Create a new project

2. **Enable pgvector extension:**
   - In Neon dashboard, go to your project
   - Open SQL Editor
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`
   - Click "Run"

3. **Get your connection string:**
   - Go to Connection Details
   - Copy the connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`)
   - Save this for Step 3

### Option B: Supabase (Alternative)

1. **Sign up at [Supabase](https://supabase.com)**
   - Create a free account
   - Create a new project

2. **Enable pgvector extension:**
   - Go to Database → Extensions
   - Enable "vector" extension
   - Or run in SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`

3. **Get your connection string:**
   - Go to Project Settings → Database
   - Copy the connection string under "Connection string" → "URI"
   - Save this for Step 3

### Option C: Vercel Postgres (Limited pgvector support)

⚠️ **Note**: Vercel Postgres may have limited pgvector support. Check their documentation first.

1. In Vercel dashboard, go to Storage
2. Create a Postgres database
3. Get the connection string from the dashboard

## Step 2: Migrate Database Schema

1. **Update your local `.env.local` with production database URL temporarily:**
   ```bash
   DATABASE_URL="your-production-database-url"
   ```

2. **Run Prisma migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Enable pgvector extension (if not already done):**
   ```bash
   # Using Prisma
   echo "CREATE EXTENSION IF NOT EXISTS vector;" > /tmp/enable_vector.sql
   npx prisma db execute --file /tmp/enable_vector.sql --schema prisma/schema.prisma
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Migrate your data:**
   - If you have existing data, you'll need to export from local and import to production
   - See `MIGRATE_DATA.md` for detailed instructions

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

### 3.3 Deploy

```bash
# From your project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (first time) or Yes (if updating)
# - Project name? cat-prep-ui (or your preferred name)
# - Directory? ./
# - Override settings? No
```

### 3.4 Configure Environment Variables

In Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following variables:

   ```
   DATABASE_URL=your-production-database-connection-string
   GEMINI_API_KEY=your-gemini-api-key
   NEXTAUTH_SECRET=generate-a-random-secret-here
   NEXTAUTH_URL=https://your-app-name.vercel.app
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   ```

3. **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and use it as `NEXTAUTH_SECRET`

4. **Update Google OAuth Redirect URI:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services → Credentials
   - Edit your OAuth 2.0 Client
   - Add authorized redirect URI: `https://your-app-name.vercel.app/api/auth/callback/google`
   - Save

### 3.5 Redeploy

After setting environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or push to your main branch (if connected to Git).

## Step 4: Build Configuration

The app should work with default Vercel settings. However, you may need to configure:

### Build Command
Vercel will auto-detect Next.js, but if needed:
- Build Command: `npm run build` (or `next build`)
- Output Directory: `.next`

### Install Command
- Install Command: `npm install`

## Step 5: Post-Deployment Checklist

- [ ] Database connection works (check Vercel logs)
- [ ] Authentication works (test Google OAuth)
- [ ] Chat functionality works (test with a question)
- [ ] Vector search works (test semantic search)
- [ ] Progress tracking works (make a test attempt)
- [ ] All environment variables are set correctly

## Step 6: Index Embeddings in Production

After deployment, you need to generate embeddings for your questions:

1. **Option A: Run locally pointing to production DB**
   ```bash
   # Temporarily set DATABASE_URL to production
   export DATABASE_URL="your-production-database-url"
   npx tsx scripts/runIndexing.ts
   ```

2. **Option B: Create a Vercel Serverless Function**
   - See `scripts/deploy-indexing.ts` for a one-time indexing endpoint
   - Call it once after deployment

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct in Vercel dashboard
- Check if database allows connections from Vercel IPs (most cloud DBs do by default)
- Ensure SSL is enabled in connection string (`?sslmode=require`)

### Authentication Issues

- Verify `NEXTAUTH_URL` matches your Vercel domain exactly
- Check Google OAuth redirect URI includes your production domain
- Ensure `NEXTAUTH_SECRET` is set and is a strong random string

### Build Failures

- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Prisma client is generated: `npx prisma generate`

### Vector Search Not Working

- Verify pgvector extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- Check if embeddings exist: Run verification script
- Ensure Transformers.js model can load (may need to check bundle size)

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for chat | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth encryption | Yes |
| `NEXTAUTH_URL` | Your app URL (https://your-app.vercel.app) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes |

## Next Steps

1. Set up custom domain (optional) in Vercel dashboard
2. Configure monitoring and error tracking
3. Set up database backups
4. Configure rate limiting if needed
5. Set up CI/CD for automatic deployments

## Support

For issues:
- Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
- Check database logs in your database provider's dashboard
- Review Next.js and Vercel documentation

