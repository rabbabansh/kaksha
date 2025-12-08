# Fix Invalid Prisma Accelerate API Key

## The Error
```
The provided API Key is invalid. Reason: API key is invalid (P6002)
```

## Solution Options

### Option 1: Get a New Prisma Accelerate API Key (Recommended)

1. **Go to Prisma Data Platform:**
   - Visit https://console.prisma.io/
   - Log in to your account

2. **Navigate to your database project:**
   - Select your project
   - Go to **Connection Strings** or **Settings**

3. **Get the Accelerate connection string:**
   - Look for **"Prisma Accelerate"** or **"Connection Pooling"**
   - Copy the connection string that starts with:
     ```
     prisma+postgres://accelerate.prisma-data.net/?api_key=...
     ```

4. **Update your `.env.local`:**
   ```bash
   # Edit .env.local and replace DATABASE_URL
   DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_NEW_API_KEY"
   ```

5. **Restart your server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

### Option 2: Use Direct Connection String (Temporary Fix)

If you need to test immediately, you can use the direct connection string instead:

1. **Get the direct connection string from Prisma:**
   - Go to https://console.prisma.io/
   - Navigate to your database project
   - Find **"Direct Connection"** (not Accelerate)
   - Copy the connection string (starts with `postgresql://`)

2. **Update your `.env.local`:**
   ```bash
   # Temporarily use direct connection
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

3. **Restart your server:**
   ```bash
   npm run dev
   ```

**Note:** Direct connection works but doesn't have the performance benefits of Accelerate. Use this only for testing.

### Option 3: Check API Key Status

1. **Verify the API key is active:**
   - Go to Prisma dashboard
   - Check if Accelerate is enabled for your project
   - Verify the API key hasn't been revoked

2. **Regenerate if needed:**
   - Some Prisma plans allow regenerating API keys
   - Check your project settings

## Verification

After updating, test the connection:

```bash
# Test Prisma connection
npx prisma db pull

# Or launch Prisma Studio
npx prisma studio
```

If these work, your connection is fixed!

## Common Issues

### API Key Expired
- Prisma Accelerate API keys can expire
- Get a new one from the dashboard

### Wrong Project
- Make sure you're using the API key from the correct Prisma project
- Check the project name matches your database

### API Key Format
- Should be in format: `prisma+postgres://accelerate.prisma-data.net/?api_key=...`
- Make sure there are no extra spaces or quotes in `.env.local`

