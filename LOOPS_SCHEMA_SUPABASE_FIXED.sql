-- Loops Schema for Supabase - Fixed Version
-- Copy and paste this into your Supabase SQL Editor

-- Create the loops_outbox table
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

-- Create or update the set_updated_at function (if it doesn't exist)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger
DROP TRIGGER IF EXISTS trigger_loops_outbox_updated_at ON public.loops_outbox;
CREATE TRIGGER trigger_loops_outbox_updated_at
  BEFORE UPDATE ON public.loops_outbox
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Grant permissions
GRANT ALL ON public.loops_outbox TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.loops_outbox TO anon;
GRANT SELECT, INSERT, UPDATE ON public.loops_outbox TO authenticated;

-- Verify the table was created (this will show a success message)
SELECT 
  'loops_outbox table created successfully!' as message,
  COUNT(*) as initial_row_count
FROM public.loops_outbox;