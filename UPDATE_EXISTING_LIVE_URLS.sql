-- Update existing approved nominations with live URLs
-- Execute this after running LIVE_URL_SIMPLE_FIX.sql

-- Update approved nominations that don't have live URLs yet
UPDATE public.nominations 
SET live_url = CONCAT(
  'https://worldstaffingawards.com/nominee/',
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        CASE 
          WHEN ne.type = 'person' THEN TRIM(CONCAT(COALESCE(ne.firstname, ''), ' ', COALESCE(ne.lastname, '')))
          ELSE COALESCE(ne.company_name, '')
        END,
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  )
)
FROM public.nominees ne
WHERE nominations.nominee_id = ne.id
  AND nominations.state = 'approved' 
  AND (nominations.live_url IS NULL OR nominations.live_url = '')
  AND (
    (ne.type = 'person' AND (ne.firstname IS NOT NULL OR ne.lastname IS NOT NULL))
    OR (ne.type = 'company' AND ne.company_name IS NOT NULL)
  );

-- Verify the updates
SELECT 
  n.id,
  n.state,
  n.live_url,
  ne.type,
  ne.firstname,
  ne.lastname,
  ne.company_name,
  CASE 
    WHEN ne.type = 'person' THEN TRIM(CONCAT(COALESCE(ne.firstname, ''), ' ', COALESCE(ne.lastname, '')))
    ELSE COALESCE(ne.company_name, '')
  END as display_name
FROM public.nominations n
JOIN public.nominees ne ON n.nominee_id = ne.id
WHERE n.state = 'approved'
ORDER BY n.created_at DESC;