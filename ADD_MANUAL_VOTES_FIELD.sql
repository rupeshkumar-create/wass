-- Add manual/additional votes field to nominations table
-- This allows admins to manually adjust vote counts

ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS additional_votes INTEGER DEFAULT 0;

-- Add comment to explain the field
COMMENT ON COLUMN nominations.additional_votes IS 'Manual votes added by admin, added to real vote count for total display';

-- Update existing records to have 0 additional votes
UPDATE nominations 
SET additional_votes = 0 
WHERE additional_votes IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_nominations_additional_votes ON nominations(additional_votes);