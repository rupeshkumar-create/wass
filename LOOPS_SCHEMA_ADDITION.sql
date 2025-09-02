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

CREATE INDEX IF NOT EXISTS idx_loops_outbox_status_created ON public.loops_outbox(status, created_at);

-- Add updated_at trigger for loops_outbox
DROP TRIGGER IF EXISTS trigger_loops_outbox_updated_at ON public.loops_outbox;
CREATE TRIGGER trigger_loops_outbox_updated_at
  BEFORE UPDATE ON public.loops_outbox
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Grant permissions
GRANT ALL ON public.loops_outbox TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Loops outbox table created successfully!';
  RAISE NOTICE 'This extends the existing schema for Loops integration.';
END $$;