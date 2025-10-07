/**
 * Integration tests for API hooks
 * Tests all market and PvP hooks
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMarketApi, useMarketHistory } from '@/hooks/use-market-api';
import { useRecentKills, useSearch, usePlayerDetails, useGuildLeaderboard } from '@/hooks/use-pvp-api';
import React from 'react';

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe.skip('Market API Hooks', () => {
  it('useMarketApi - fetches market prices', async () => {
    const { result } = renderHook(
      () => useMarketApi({
        itemIds: 'T4_BAG',
        locations: 'Caerleon',
        qualities: [1],
      }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
  
  it('useMarketApi - handles multiple items', async () => {
    const { result } = renderHook(
      () => useMarketApi({
        itemIds: ['T4_BAG', 'T5_BAG'],
        locations: 'Caerleon',
      }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
  
  it('useMarketHistory - fetches historical data', async () => {
    const { result } = renderHook(
      () => useMarketHistory({
        itemIds: 'T4_BAG',
        locations: 'Caerleon',
        timeScale: 24,
      }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe.skip('PvP API Hooks', () => {
  it('useRecentKills - fetches recent kills', async () => {
    const { result } = renderHook(
      () => useRecentKills({ limit: 10 }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
  });
  
  it('useSearch - searches for players', async () => {
    const { result } = renderHook(
      () => useSearch({ query: 'test' }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveProperty('players');
  });
  
  it('useGuildLeaderboard - fetches guild rankings', async () => {
    const { result } = renderHook(
      () => useGuildLeaderboard({ type: 'attacks', range: 'week', limit: 10 }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
  });
  
  it('usePlayerDetails - fetches player details', async () => {
    // First get a player ID from recent kills
    const { result: killsResult } = renderHook(
      () => useRecentKills({ limit: 1 }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(killsResult.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    const playerId = killsResult.current.data?.[0]?.Killer?.Id;
    
    if (!playerId) {
      console.warn('No player ID available, skipping test');
      return;
    }
    
    const { result: playerResult } = renderHook(
      () => usePlayerDetails({ playerId }),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => expect(playerResult.current.isSuccess).toBe(true), {
      timeout: 10000,
    });
    
    expect(playerResult.current.data).toBeDefined();
    expect(playerResult.current.data).toHaveProperty('player');
    expect(playerResult.current.data).toHaveProperty('kills');
    expect(playerResult.current.data).toHaveProperty('deaths');
    expect(playerResult.current.data).toHaveProperty('stats');
  });
});

describe.skip('Hook Error Handling', () => {
  it('useMarketApi - handles missing item IDs', async () => {
    const { result } = renderHook(
      () => useMarketApi({ itemIds: '' }),
      { wrapper: createWrapper() }
    );
    
    // Should not fetch when itemIds is empty
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
  
  it('useSearch - handles empty query', async () => {
    const { result } = renderHook(
      () => useSearch({ query: '' }),
      { wrapper: createWrapper() }
    );
    
    // Should not fetch when query is empty
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
