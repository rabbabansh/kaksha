# Quick Deployment Guide

A condensed guide to get your app deployed quickly.

## 🚀 Quick Steps

### 1. Set Up Database (5 minutes)

**Option A: Neon (Recommended)**
1. Sign up at [neon.tech](https://neon.tech)
2. Create project → Copy connection string
3. In SQL Editor, run: `CREATE EXTENSION IF NOT EXISTS vector;`

**Option B: Supabase**
1. Sign up at [supabase.com](https://supabase.com)
2. Create project → Enable "vector" extension
3. Copy connection string from Settings → Database

### 2. Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then set environment variables in dashboard
```

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
DATABASE_URL=your-database-connection-string
GEMINI_API_KEY=your-gemini-key
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Edit OAuth 2.0 Client
3. Add redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

### 5. Migrate Database

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Enable pgvector (if not done in dashboard)
echo "CREATE EXTENSION IF NOT EXISTS vector;" | psql "$DATABASE_URL"
```

### 6. Migrate Data & Index Embeddings

```bash
# Migrate questions (if you have local data)
# See MIGRATE_DATA.md for details

# Generate embeddings
DATABASE_URL="your-production-database-url" npx tsx scripts/index-production.ts
```

### 7. Redeploy

```bash
vercel --prod
```

## ✅ Checklist

- [ ] Database created and pgvector enabled
- [ ] Vercel deployment successful
- [ ] All environment variables set
- [ ] Google OAuth redirect URI updated
- [ ] Database migrations run
- [ ] Questions data migrated (if applicable)
- [ ] Embeddings indexed
- [ ] Test authentication
- [ ] Test chat functionality
- [ ] Test vector search

## 📚 Detailed Guides

- **Full deployment**: See `DEPLOYMENT.md`
- **Data migration**: See `MIGRATE_DATA.md`
- **Environment variables**: See `ENV_VARIABLES.md`

## 🆘 Common Issues

**Database connection fails**
- Check `DATABASE_URL` format
- Ensure SSL is enabled (`?sslmode=require`)
- Verify database allows external connections

**Authentication doesn't work**
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check Google OAuth redirect URI includes production domain
- Ensure `NEXTAUTH_SECRET` is set

**Vector search not working**
- Verify pgvector extension is enabled
- Run indexing script: `npx tsx scripts/index-production.ts`
- Check embeddings exist: `SELECT COUNT(*) FROM "QuestionVector";`

## 🎉 You're Done!

Your app should now be live at `https://your-app.vercel.app`

