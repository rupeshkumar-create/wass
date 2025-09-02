-- Check Supabase Database Columns
-- Run this in your Supabase SQL Editor to see what columns exist

-- 1. Check nominations table columns
SELECT 
    'nominations' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'nominations' 
ORDER BY ordinal_position;

-- 2. Check if public_nominees view exists and what columns it has
SELECT 
    'public_nominees' as view_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'public_nominees' 
ORDER BY ordinal_position;

-- 3. Test a simple query on public_nominees to see what works
SELECT 
    id,
    category,
    nominee_name,
    CASE 
        WHEN nominee_title IS NOT NULL THEN 'nominee_title exists'
        ELSE 'nominee_title is null'
    END as title_status,
    votes
FROM public_nominees 
LIMIT 3;