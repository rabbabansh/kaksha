# Quick Fix for Invalid API Key

## Immediate Solution

If you have the direct connection string from your database import, you can use it temporarily:

1. **Edit `.env.local`:**
   ```bash
   # Comment out the Accelerate URL:
   # DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
   
   # Add direct connection (use the one you used for pg_restore):
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

2. **Restart your server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev    # for development
   # or
   npm start      # for production
   ```

## Permanent Fix

Get a new Prisma Accelerate API key:
- Visit: https://console.prisma.io/
- Navigate to your project → Connection Strings
- Copy the Prisma Accelerate connection string
- Update `.env.local` with the new URL

## Test Connection

After updating, test:
```bash
npx prisma db pull
```

If this works, your connection is fixed!
