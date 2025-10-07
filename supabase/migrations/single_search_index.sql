-- Single Most Important Index for Fast Search
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run

-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the search index (this is the one that makes search 100x faster)
CREATE INDEX IF NOT EXISTS idx_market_prices_itemid_trgm 
ON market_prices USING gin("itemId" gin_trgm_ops);

-- Verify it was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'market_prices' 
AND indexname = 'idx_market_prices_itemid_trgm';
