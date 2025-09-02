# Loops Schema - Manual Supabase Setup

## SQL to Run in Supabase SQL Editor

Copy and paste this SQL into your Supabase SQL Editor and run it:

```sql
-- Add Loops outbox table for backup sync
-- This extends the existing schema without affecting current functionality

-- LOOPS_OUTBOX: Queue for Loops sync (similar to hubspot_outbox)
CREATE TABLE IF NOT EXISTS public.loops_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('nomination_submitted','nomination_approved','vote_cast','nominator_live_update')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','dead')),
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_loops_outbox_status_created ON public.loops_outbox(status, created_at);

-- Add updated_at trigger for loops_outbox
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_loops_outbox_updated_at ON public.loops_outbox;
CREATE TRIGGER trigger_loops_outbox_updated_at
  BEFORE UPDATE ON public.loops_outbox
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Grant permissions
GRANT ALL ON public.loops_outbox TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.loops_outbox TO anon;
GRANT SELECT, INSERT, UPDATE ON public.loops_outbox TO authenticated;

-- Verify table was created
SELECT 'loops_outbox table created successfully!' as message;
```

## What This Does

1. **Creates `loops_outbox` table** - Stores backup sync data for Loops integration
2. **Adds proper indexes** - For efficient querying by status and date
3. **Sets up triggers** - Automatically updates `updated_at` timestamp
4. **Grants permissions** - Allows your app to read/write to the table

## After Running This SQL

1. The Loops integration will have full backup sync capability
2. Failed syncs will be retried automatically
3. You can monitor sync status via the outbox table
4. Manual sync endpoint will work properly

## Verification

After running the SQL, you can verify it worked by running this query:

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loops_outbox' 
ORDER BY ordinal_position;
```

You should see all the columns listed (id, event_type, payload, status, etc.).

## Test Again

Once you've run this SQL in Supabase, run the test again:

```bash
node scripts/test-loops-integration-complete.js
```

The outbox errors should be gone and you'll see full backup sync functionality working.