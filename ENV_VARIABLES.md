# Environment Variables Reference

This document lists all environment variables required for the CAT Prep application.

## Required Variables

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string with SSL | `postgresql://user:password@host:5432/dbname?sslmode=require` |

**Notes:**
- Must include SSL mode for production databases
- Format: `postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require`
- Get from your database provider (Neon, Supabase, etc.)

### Authentication (NextAuth)

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `NEXTAUTH_SECRET` | Secret key for encrypting tokens | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your application URL | `https://your-app.vercel.app` (production) or `http://localhost:3000` (dev) |

**Notes:**
- `NEXTAUTH_SECRET` must be a strong random string (32+ characters)
- `NEXTAUTH_URL` must match your actual domain exactly
- Never commit secrets to version control

### Google OAuth

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | [Google Cloud Console](https://console.cloud.google.com/) |

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-app.vercel.app/api/auth/callback/google`
6. Copy Client ID and Client Secret

### AI Chat (Gemini)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |

**Setup Steps:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key (keep it secure)

## Environment-Specific Values

### Development (`.env.local`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cat_prep"
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Production (Vercel Dashboard)

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Setting Variables in Vercel

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select `Production`, `Preview`, and/or `Development`
4. Click **Save**
5. Redeploy your application for changes to take effect

## Security Best Practices

1. ✅ **Never commit `.env.local`** to version control
2. ✅ **Use different secrets** for development and production
3. ✅ **Rotate secrets regularly**, especially if exposed
4. ✅ **Use strong random strings** for `NEXTAUTH_SECRET`
5. ✅ **Restrict API keys** to specific domains/IPs when possible
6. ✅ **Use environment-specific values** (dev vs production)

## Verification

After setting variables, verify they're loaded:

```bash
# Check if variables are set (local)
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL set' : '❌ DATABASE_URL missing')"

# In Vercel, check Function Logs for errors
```

## Troubleshooting

### Variable Not Found

- Check spelling (case-sensitive)
- Verify variable is set in correct environment
- Restart development server after adding to `.env.local`
- Redeploy after adding to Vercel

### Database Connection Fails

- Verify `DATABASE_URL` format is correct
- Check SSL requirements (`?sslmode=require`)
- Ensure database allows connections from Vercel IPs
- Test connection: `psql "$DATABASE_URL" -c "SELECT 1;"`

### Authentication Not Working

- Verify `NEXTAUTH_URL` matches your domain exactly
- Check `NEXTAUTH_SECRET` is set and strong
- Ensure Google OAuth redirect URI includes your domain
- Check browser console for errors

### API Errors

- Verify `GEMINI_API_KEY` is valid and not expired
- Check API quotas/limits
- Review error logs in Vercel dashboard

