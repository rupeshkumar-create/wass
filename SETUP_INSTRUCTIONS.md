# 🚀 WSA 2026 Supabase Setup Instructions

## Step 1: Create Database Schema

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `cabdkztnkycebttlcmckx`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Schema**
   - Open the file `supabase-schema.sql` in your project
   - Copy ALL the contents (entire file)
   - Paste into the SQL Editor

4. **Execute Schema**
   - Click the "Run" button (or press Ctrl/Cmd + Enter)
   - Wait for execution to complete
   - You should see "Success. No rows returned" or similar

5. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see 4 tables:
     - `nominations`
     - `nominators` 
     - `voters`
     - `hubspot_outbox`

## Step 2: Test the Integration

Once the schema is created, run the test:

```bash
# Start development server (if not already running)
npm run dev

# In another terminal, run the integration test
node scripts/test-supabase-integration.js
```

## Step 3: Expected Test Results

The test should:
- ✅ Submit a person nomination
- ✅ Approve the nomination  
- ✅ Cast a vote
- ✅ Prevent duplicate votes (409 error)
- ✅ Submit a company nomination
- ✅ Access HubSpot sync worker

## Troubleshooting

**If you see "table does not exist" errors:**
- Double-check that you copied the ENTIRE schema file
- Make sure you clicked "Run" in the SQL Editor
- Check the Table Editor to see if tables were created

**If you see connection errors:**
- Verify your `.env.local` file has the correct credentials
- Restart your development server: `npm run dev`

**If tests fail:**
- Check the browser console for detailed error messages
- Look at the terminal running `npm run dev` for server logs

## Your Current Configuration

✅ **Supabase URL:** `https://cabdkztnkycebttlcmckx.supabase.co`
✅ **Service Role Key:** Configured in `.env.local`
✅ **Anon Key:** Available for future client-side use

## Next Steps After Setup

1. **Run the full test suite** to verify everything works
2. **Update your UI components** to call the new API routes
3. **Implement HubSpot sync logic** in the worker route
4. **Deploy to production** with environment variables

---

**Need help?** Check the detailed guide in `SUPABASE_INTEGRATION_GUIDE.md`