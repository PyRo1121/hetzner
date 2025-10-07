-- Market Prices Performance Indexes
-- ⚠️ CRITICAL: CREATE INDEX CONCURRENTLY cannot run in a transaction block
--
-- HOW TO USE:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy ONE statement at a time (e.g., just the CREATE INDEX line)
-- 3. Paste and run it
-- 4. Wait for it to complete (5-30 minutes each)
-- 5. Move to next statement
--
-- DO NOT:
-- ❌ Select multiple statements and run together
-- ❌ Run the entire file at once
-- ❌ Use transactions (BEGIN/COMMIT)

-- ============================================
-- QUICK START (Most Important Index First!)
-- ============================================
-- If you only have time for ONE index, run this one:
-- It enables fast ILIKE search (your search feature)
--
-- CREATE INDEX CONCURRENTLY idx_market_prices_itemid_trgm
-- ON market_prices USING gin("itemId" gin_trgm_ops);
--
-- (See Step 4 below for full command)

-- ============================================
-- STEP 1: Enable extension (run this first)
-- ============================================
-- Copy ONLY this line and run it:
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- STEP 2: Critical indexes (run these first)
-- ============================================

-- Index 1: Timestamp (most critical - used in every query)
-- Copy ONLY these 2 lines and run separately:
-- Estimated time: 10-15 minutes
CREATE INDEX CONCURRENTLY idx_market_prices_timestamp
ON market_prices("timestamp" DESC);

-- Index 2: ItemId (critical for searches)
-- Copy ONLY these 2 lines and run separately:
-- Estimated time: 10-15 minutes
CREATE INDEX CONCURRENTLY idx_market_prices_itemid
ON market_prices("itemId");

-- Index 3: City (for location filtering)
-- Copy ONLY these 2 lines and run separately:
-- Estimated time: 5-10 minutes
CREATE INDEX CONCURRENTLY idx_market_prices_city
ON market_prices(city);

-- ============================================
-- STEP 3: Composite indexes (run after step 2)
-- ============================================

-- Index 4: City + Timestamp (for recent prices by location)
-- Estimated time: 15-20 minutes
CREATE INDEX CONCURRENTLY idx_market_prices_city_timestamp
ON market_prices(city, "timestamp" DESC);

-- Index 5: ItemId + City (for specific item in specific city)
-- Estimated time: 15-20 minutes
CREATE INDEX CONCURRENTLY idx_market_prices_item_city
ON market_prices("itemId", city);

-- Index 6: Quality (for quality filtering)
-- Estimated time: 5-10 minutes
CREATE INDEX CONCURRENTLY idx_market_prices_quality
ON market_prices(quality);

-- ============================================
-- STEP 4: Text search index (MOST IMPORTANT FOR SEARCH SPEED!)
-- ============================================

-- Index 7: GIN Trigram for ILIKE searches (enables fast text search)
-- ⚡ THIS IS THE KEY INDEX FOR YOUR SEARCH FEATURE
-- Estimated time: 20-30 minutes (slowest but most important)
CREATE INDEX CONCURRENTLY idx_market_prices_itemid_trgm
ON market_prices USING gin("itemId" gin_trgm_ops);

-- ============================================
-- STEP 5: Verify indexes were created
-- ============================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'market_prices'
ORDER BY indexname;

-- ============================================
-- Expected Performance Improvements:
-- ============================================
-- Before indexes:
--   - Search query: 5-10 seconds (full table scan)
--   - Recent items: 2-3 seconds
--
-- After indexes:
--   - Search query: 200-500ms (100x faster!) ⚡
--   - Recent items: 50-100ms (30x faster!) ⚡
-- ============================================
