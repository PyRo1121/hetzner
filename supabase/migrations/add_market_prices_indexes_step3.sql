-- Step 3: Create remaining indexes (optional, for advanced queries)
-- Run this after step 2 completes
-- These are less critical and can be skipped if timeouts persist

-- Composite: itemId + quality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_item_quality 
ON market_prices("itemId", quality);

-- GIN index for fuzzy text search (ILIKE queries)
-- This is the slowest to build but enables fast text search
-- Skip this if you don't need ILIKE/fuzzy search on itemId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_itemid_trgm 
ON market_prices USING gin("itemId" gin_trgm_ops);
