-- Add indexes to market_prices table for better query performance
-- This migration improves search and filter performance on 15M+ rows
-- Uses CONCURRENTLY to avoid locking the table during index creation

-- Enable pg_trgm extension first (for fuzzy text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes CONCURRENTLY to avoid blocking reads/writes
-- Note: CONCURRENTLY cannot be used inside a transaction block
-- Run these one at a time if needed

-- Index on itemId for fast item lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_itemid ON market_prices("itemId");

-- Index on city for location-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_city ON market_prices(city);

-- Index on quality for quality filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_quality ON market_prices(quality);

-- Index on timestamp for time-based queries (most important for ORDER BY)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_timestamp ON market_prices("timestamp" DESC);

-- Composite index for city + timestamp (recent prices by location)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_city_timestamp ON market_prices(city, "timestamp" DESC);

-- Composite index for common query patterns (itemId + city)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_item_city ON market_prices("itemId", city);

-- Composite index for itemId + quality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_item_quality ON market_prices("itemId", quality);

-- GIN index for text search on itemId (for ILIKE queries) - this is the slowest
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_prices_itemid_trgm ON market_prices USING gin("itemId" gin_trgm_ops);
