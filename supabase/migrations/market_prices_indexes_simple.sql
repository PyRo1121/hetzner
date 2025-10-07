-- Market Prices Performance Indexes (Without CONCURRENTLY)
-- These will lock the table during creation but work in Supabase SQL Editor
-- Run these ONE AT A TIME, waiting for each to complete

-- ============================================
-- STEP 1: Enable extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- STEP 2: Most Important Index (Run This First!)
-- ============================================
-- This enables fast ILIKE search - your search feature
-- Estimated time: 20-30 minutes
-- ⚠️ Table will be locked during creation (read-only)
CREATE INDEX IF NOT EXISTS idx_market_prices_itemid_trgm 
ON market_prices USING gin("itemId" gin_trgm_ops);

-- ============================================
-- STEP 3: Other Critical Indexes
-- ============================================

-- Timestamp index (for ORDER BY)
CREATE INDEX IF NOT EXISTS idx_market_prices_timestamp 
ON market_prices("timestamp" DESC);

-- ItemId index (for WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_market_prices_itemid 
ON market_prices("itemId");

-- City index (for location filtering)
CREATE INDEX IF NOT EXISTS idx_market_prices_city 
ON market_prices(city);

-- Quality index (for quality filtering)
CREATE INDEX IF NOT EXISTS idx_market_prices_quality 
ON market_prices(quality);

-- ============================================
-- STEP 4: Composite Indexes (Optional)
-- ============================================

-- City + Timestamp
CREATE INDEX IF NOT EXISTS idx_market_prices_city_timestamp 
ON market_prices(city, "timestamp" DESC);

-- ItemId + City
CREATE INDEX IF NOT EXISTS idx_market_prices_item_city 
ON market_prices("itemId", city);

-- ItemId + Quality
CREATE INDEX IF NOT EXISTS idx_market_prices_item_quality 
ON market_prices("itemId", quality);

-- ============================================
-- STEP 5: Verify indexes
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'market_prices'
ORDER BY indexname;
