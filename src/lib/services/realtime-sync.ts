/**
 * Real-Time Data Sync Service
 * Connects NATS stream to Supabase database
 * Week 2: Real-time NATS integration
 */

import { backend } from '@/backend';

import {
  type AODPNatsClient,
  type GoldPriceMessage,
  type MarketOrderMessage,
} from '@/lib/api/aodp/nats-client';

const crypto = require('crypto');

const supabase = backend.admin;

let natsClient: AODPNatsClient | null = null;
let isRunning = false;

const shouldLogDebug = process.env.NODE_ENV !== 'production';

const cityMap: Record<number, string> = {
  3005: 'Caerleon',
  1002: 'Lymhurst',
  2004: 'Bridgewatch',
  4002: 'Martlock',
  3003: 'Fort Sterling',
  4006: 'Thetford',
};

function logDebug(message: string, ...payload: unknown[]) {
  if (shouldLogDebug) {
    console.warn(message, ...payload);
  }
}

async function handleGoldPriceMessage(message: GoldPriceMessage): Promise<void> {
  try {
    const { error } = await supabase.from('gold_prices').insert({
      id: crypto.randomUUID(),
      price: message.Price,
      timestamp: new Date(message.Timestamp).toISOString(),
      server: 'Americas',
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error('[RealtimeSync] Supabase error saving gold price:', error);
      return;
    }

    logDebug('[RealtimeSync] Gold price updated:', message.Price);
  } catch (error) {
    console.error('[RealtimeSync] Error saving gold price:', error);
  }
}

async function handleMarketOrderMessage(message: MarketOrderMessage): Promise<void> {
  try {
    const city = cityMap[message.LocationId] ?? 'Unknown';

    const { error } = await supabase.from('market_prices').insert({
      id: crypto.randomUUID(),
      itemId: message.ItemTypeId,
      itemName: message.ItemTypeId,
      city,
      quality: message.QualityLevel,
      sellPriceMin: message.AuctionType === 'offer' ? message.UnitPriceSilver : 0,
      sellPriceMax: message.AuctionType === 'offer' ? message.UnitPriceSilver : 0,
      buyPriceMin: message.AuctionType === 'request' ? message.UnitPriceSilver : 0,
      buyPriceMax: message.AuctionType === 'request' ? message.UnitPriceSilver : 0,
      timestamp: new Date(message.Expires).toISOString(),
      server: 'Americas',
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error('[RealtimeSync] Supabase error saving market order:', error);
      return;
    }

    logDebug('[RealtimeSync] Market order processed:', message.ItemTypeId, message.UnitPriceSilver);
  } catch (error) {
    console.error('[RealtimeSync] Error saving market order:', error);
  }
}

/**
 * Start real-time sync service
 */
export async function startRealtimeSync() {
  if (isRunning) {
    logDebug('[RealtimeSync] Already running');
    return;
  }

  try {
    logDebug('[RealtimeSync] Starting NATS connection...');

    const { AODPNatsClient } = await import('@/lib/api/aodp/nats-client');
    natsClient = new AODPNatsClient();
    await natsClient.connect();

    // Subscribe to gold prices
    await natsClient.subscribeToGoldPrices((message: GoldPriceMessage) => {
      void handleGoldPriceMessage(message);
    });

    // Subscribe to market orders
    await natsClient.subscribeToMarketOrders((message: MarketOrderMessage) => {
      void handleMarketOrderMessage(message);
    });

    isRunning = true;
    logDebug('[RealtimeSync] Service started successfully');
  } catch (error) {
    console.error('[RealtimeSync] Failed to start:', error);
    throw error;
  }
}

/**
 * Stop real-time sync service
 */
export async function stopRealtimeSync() {
  if (natsClient) {
    await natsClient.disconnect();
    natsClient = null;
  }

  isRunning = false;
  logDebug('[RealtimeSync] Service stopped');
}

/**
 * Check if service is running
 */
export function isRealtimeSyncRunning(): boolean {
  return isRunning;
}
