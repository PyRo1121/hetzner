-- Step 2: Create composite indexes for common query patterns
-- Run this after step 1 completes

-- Composite: city + timestamp (for recent prices by location)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_city_timestamp 
ON market_prices(city, "timestamp" DESC);

-- Composite: itemId + city (for specific item in specific city)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_item_city 
ON market_prices("itemId", city);

-- Simple: quality (for quality filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_quality 
ON market_prices(quality);
