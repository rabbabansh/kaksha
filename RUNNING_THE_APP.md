# Running the CAT Prep App

## Quick Start

1. **Make sure PostgreSQL is running:**
   ```bash
   docker ps --filter "name=postgres-cat-prep"
   ```
   If not running, start it:
   ```bash
   docker start postgres-cat-prep
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to: http://localhost:3000

## What to Test

### 1. Authentication
- Click "Sign In" 
- Test Google OAuth login
- Verify you can sign out

### 2. Chat Interface
- Navigate to the chat page
- Ask a question like: "Give me a question about algebra"
- Verify the AI responds and can retrieve questions from your database
- Test submitting an answer to a question
- Check that feedback and explanations appear

### 3. Vector Search
- Ask questions about specific topics (e.g., "Geometry", "Reading Comprehension")
- Verify the AI finds relevant questions using semantic search
- Check that questions are displayed with options

### 4. Progress Tracking
- Navigate to the Progress page
- Verify your stats are displayed (Kaksha score, strengths, weaknesses)
- Check that progress bars show for different topics/subtopics

### 5. Test Pages
- Browse available test years and slots
- Try starting a test
- Verify questions load correctly

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use: `lsof -i :3000`
- Kill the process if needed: `kill -9 <PID>`

### Database connection errors
- Verify PostgreSQL is running: `docker ps`
- Check DATABASE_URL in `.env.local`
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

### Embeddings not working
- Verify vectors exist: Run `npx tsx scripts/verify-setup.ts`
- Check if indexing completed: Should show 4418 vectors

### Chat not responding
- Check GEMINI_API_KEY in `.env.local`
- Verify API key is valid
- Check browser console for errors

## Production Build

To test a production build:

```bash
npm run build
npm start
```

This will:
- Build optimized production bundle
- Start production server on port 3000
- Use production optimizations

## Environment Variables Required

Make sure `.env.local` contains:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - For AI chat functionality
- `NEXTAUTH_SECRET` - For authentication
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth

## Next Steps After Running

1. **Test the chat** - Ask questions and verify vector search works
2. **Check progress** - Make some attempts and verify tracking
3. **Test authentication** - Sign in/out to verify OAuth
4. **Browse questions** - Verify questions load from PostgreSQL
5. **Check embeddings** - Verify semantic search finds relevant questions

