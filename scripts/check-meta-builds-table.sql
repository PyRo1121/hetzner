-- Check the actual structure of meta_builds table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'meta_builds' 
ORDER BY ordinal_position;
