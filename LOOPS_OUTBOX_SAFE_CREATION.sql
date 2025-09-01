-- Safe creation of loops_outbox table
-- This version handles existing objects gracefully

-- Create the table only if it doesn't exist
CREATE TABLE IF NOT EXISTS loops_outbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes only if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_loops_outbox_status') THEN
    CREATE INDEX idx_loops_outbox_status ON loops_outbox(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_loops_outbox_event_type') THEN
    CREATE INDEX idx_loops_outbox_event_type ON loops_outbox(event_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_loops_outbox_created_at') THEN
    CREATE INDEX idx_loops_outbox_created_at ON loops_outbox(created_at);
  END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_loops_outbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_loops_outbox_updated_at ON loops_outbox;
CREATE TRIGGER trigger_loops_outbox_updated_at
  BEFORE UPDATE ON loops_outbox
  FOR EACH ROW
  EXECUTE FUNCTION update_loops_outbox_updated_at();

-- Enable RLS
ALTER TABLE loops_outbox ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Service role can manage loops_outbox" ON loops_outbox;
DROP POLICY IF EXISTS "Users can read loops_outbox" ON loops_outbox;

CREATE POLICY "Service role can manage loops_outbox" ON loops_outbox
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can read loops_outbox" ON loops_outbox
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add table and column comments
COMMENT ON TABLE loops_outbox IS 'Outbox pattern for reliable Loops email sync';
COMMENT ON COLUMN loops_outbox.event_type IS 'Type of event: nomination_submitted, nomination_approved, vote_cast';
COMMENT ON COLUMN loops_outbox.payload IS 'JSON payload containing all data needed for sync';
COMMENT ON COLUMN loops_outbox.status IS 'Processing status of the sync event';
COMMENT ON COLUMN loops_outbox.attempts IS 'Number of sync attempts made';
COMMENT ON COLUMN loops_outbox.max_attempts IS 'Maximum number of attempts before giving up';