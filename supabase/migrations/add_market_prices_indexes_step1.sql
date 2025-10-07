-- Step 1: Enable extension and create most critical indexes
-- Run this first, then wait for completion before running step 2

-- Enable pg_trgm extension (required for text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Most critical index: timestamp (used in ORDER BY on every query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_timestamp 
ON market_prices("timestamp" DESC);

-- Second most critical: itemId (used in WHERE clauses)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_itemid 
ON market_prices("itemId");

-- Third: city (used in WHERE clauses for location filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_city 
ON market_prices(city);
