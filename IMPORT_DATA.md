# Import Data into Prisma Postgres

## The Problem
`pg_restore` doesn't support Prisma Accelerate's `prisma+postgres://` protocol. You need the **direct connection string** for database tools.

## Step-by-Step Solution

### Step 1: Get the Direct Connection String

1. Go to [Prisma Data Platform](https://console.prisma.io/)
2. Navigate to your database project
3. Go to **Connection Strings** or **Database Settings**
4. Look for **"Direct Connection"** or **"Connection Pooling"** section
5. Copy the **direct connection string** (should look like):
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```
   **NOT** the `prisma+postgres://accelerate.prisma-data.net/...` one

### Step 2: Enable pgvector Extension (REQUIRED)

**This must be done first!** The database needs the `pgvector` extension to support vector types:

```bash
# Set the direct connection string
export DIRECT_DB_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Enable pgvector extension
psql "$DIRECT_DB_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Alternative:** Enable it via Prisma Dashboard:
1. Go to your Prisma database project
2. Open SQL Editor
3. Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### Step 3: Restore the Database

Use the **direct connection string** (not the Accelerate URL) for `pg_restore`:

```bash
# Run pg_restore with flags to handle existing objects
pg_restore \
  -d "$DIRECT_DB_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -v \
  ./db_dump.bak
```

**Note:** The `--clean` flag will drop existing objects first. Use `--if-exists` to avoid errors if objects don't exist.

### Step 4: Verify the Import

```bash
# Launch Prisma Studio to browse your data
npx prisma studio
```

### Step 5: Update Your App Configuration

After importing, make sure your `.env.local` uses the **Accelerate URL** for your app:

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
```

This is correct for your Next.js app - Prisma Client will use the Accelerate connection for better performance.

## Alternative: If You Can't Find Direct Connection

If Prisma doesn't provide a direct connection string, you may need to:

1. **Check Prisma Dashboard** - Look for "Connection Details" or "Database Settings"
2. **Contact Prisma Support** - They can provide the direct connection string
3. **Use Prisma Migrate** - Instead of `pg_restore`, you could:
   - Use `prisma db push` to create schema
   - Import data using Prisma Client scripts
   - Or use `psql` with the direct connection if available

## Troubleshooting

### Error: "invalid connection option"
- ✅ You're using the direct connection string (not Accelerate URL)
- ✅ The connection string starts with `postgresql://` or `postgres://`

### Error: "connection refused" or "timeout"
- Check if the database allows connections from your IP
- Verify SSL mode is correct (`?sslmode=require`)
- Check if you need to whitelist your IP in Prisma dashboard

### Error: "permission denied"
- Verify your database user has the necessary permissions
- Check if you need to use a different user for imports

### Error: "type 'vector' does not exist"
- ✅ **Enable pgvector extension first** (see Step 2 above)
- Run: `psql "$DIRECT_DB_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"`
- Then re-run the restore

### Error: "schema 'public' already exists"
- This is a warning, not critical
- Use `--clean --if-exists` flags with `pg_restore` to handle existing objects
- Or ignore this warning if other operations succeed

