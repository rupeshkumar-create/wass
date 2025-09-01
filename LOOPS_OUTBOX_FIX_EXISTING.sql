-- Fix existing loops_outbox table by adding missing columns
-- This handles the case where the table exists but is incomplete

-- First, let's check what columns exist and add missing ones
DO $$ 
BEGIN
  -- Add attempts column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'loops_outbox' AND column_name = 'attempts') THEN
    ALTER TABLE loops_outbox ADD COLUMN attempts INTEGER DEFAULT 0;
  END IF;
  
  -- Add max_attempts column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'loops_outbox' AND column_name = 'max_attempts') THEN
    ALTER TABLE loops_outbox ADD COLUMN max_attempts INTEGER DEFAULT 3;
  END IF;
  
  -- Add error_message column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'loops_outbox' AND column_name = 'error_message') THEN
    ALTER TABLE loops_outbox ADD COLUMN error_message TEXT;
  END IF;
  
  -- Add processed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'loops_outbox' AND column_name = 'processed_at') THEN
    ALTER TABLE loops_outbox ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'loops_outbox' AND column_name = 'updated_at') THEN
    ALTER TABLE loops_outbox ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Update status column constraint if needed
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE table_name = 'loops_outbox' AND constraint_name = 'loops_outbox_status_check') THEN
    ALTER TABLE loops_outbox DROP CONSTRAINT loops_outbox_status_check;
  END IF;
  
  -- Add the correct constraint
  ALTER TABLE loops_outbox ADD CONSTRAINT loops_outbox_status_check 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
END $$;

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

-- Add table and column comments (only if they don't exist)
DO $$
BEGIN
  -- Add comments
  COMMENT ON TABLE loops_outbox IS 'Outbox pattern for reliable Loops email sync';
  COMMENT ON COLUMN loops_outbox.event_type IS 'Type of event: nomination_submitted, nomination_approved, vote_cast';
  COMMENT ON COLUMN loops_outbox.payload IS 'JSON payload containing all data needed for sync';
  COMMENT ON COLUMN loops_outbox.status IS 'Processing status of the sync event';
  
  -- Only add comments for columns that exist
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'loops_outbox' AND column_name = 'attempts') THEN
    COMMENT ON COLUMN loops_outbox.attempts IS 'Number of sync attempts made';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'loops_outbox' AND column_name = 'max_attempts') THEN
    COMMENT ON COLUMN loops_outbox.max_attempts IS 'Maximum number of attempts before giving up';
  END IF;
END $$;