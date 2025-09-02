-- Add additional_votes column to nominations table if it doesn't exist
-- This fixes the admin panel manual vote update functionality

-- 1. Add additional_votes column
ALTER TABLE public.nominations 
ADD COLUMN IF NOT EXISTS additional_votes INTEGER DEFAULT 0;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.nominations.additional_votes IS 'Manual additional votes added by admin, added to real votes for total display';

-- 3. Update any existing nominations to have 0 additional votes if NULL
UPDATE public.nominations 
SET additional_votes = 0 
WHERE additional_votes IS NULL;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_nominations_additional_votes ON public.nominations(additional_votes);

-- 5. Verification query
SELECT 
  'Nominations with additional_votes column' as check_type,
  COUNT(*) as total_nominations,
  COUNT(additional_votes) as nominations_with_additional_votes,
  SUM(COALESCE(additional_votes, 0)) as total_additional_votes
FROM public.nominations;

-- SUCCESS MESSAGE
SELECT 'ADDITIONAL VOTES COLUMN ADDED SUCCESSFULLY!' as status,
       'Admin panel manual vote updates should now work correctly' as details;