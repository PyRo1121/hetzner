/**
 * Backend Realtime Utilities
 * Consolidated Supabase realtime subscriptions.
 */
import { supabase } from '@/backend/supabase/clients';
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';

type MarketPriceRow = Record<string, unknown>;
type GoldPriceRow = Record<string, unknown>;

export type PriceUpdateCallback = (payload: RealtimePostgresInsertPayload<MarketPriceRow>) => void;

const shouldLogDebug = process.env.NODE_ENV !== 'production';

function logDebug(message: string, ...payload: unknown[]) {
  if (shouldLogDebug) {
    console.warn(message, ...payload);
  }
}

export function subscribeToMarketPrices(
  callback: PriceUpdateCallback
): RealtimeChannel {
  const channel = supabase
    .channel('market_prices_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'market_prices',
      },
      (payload) => {
        logDebug('[Realtime] Market price update:', payload);
        callback(payload as RealtimePostgresInsertPayload<MarketPriceRow>);
      }
    )
    .subscribe((status) => {
      logDebug('[Realtime] Subscription status:', status);
    });

  return channel;
}

export function subscribeToGoldPrices(
  callback: (payload: RealtimePostgresInsertPayload<GoldPriceRow>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('gold_prices_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'gold_prices',
      },
      (payload) => {
        logDebug('[Realtime] Gold price update:', payload);
        callback(payload as RealtimePostgresInsertPayload<GoldPriceRow>);
      }
    )
    .subscribe();

  return channel;
}

export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}

export function subscribeToPvPKills(
  callback: (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('kill_events_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'kill_events',
      },
      (payload) => {
        logDebug('[Realtime] Kill event:', payload);
        callback(payload as RealtimePostgresInsertPayload<Record<string, unknown>>);
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToBattles(
  callback: (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('battles_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'battles',
      },
      (payload) => {
        logDebug('[Realtime] Battle update:', payload);
        callback(payload as RealtimePostgresInsertPayload<Record<string, unknown>>);
      }
    )
    .subscribe();

  return channel;
}

export function createPresenceChannel(
  roomId: string,
  userId: string,
  metadata?: Record<string, any>
): RealtimeChannel {
  const channel = supabase.channel(roomId, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      logDebug('[Presence] Sync:', state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      logDebug('[Presence] Join:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      logDebug('[Presence] Leave:', key, leftPresences);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track({
          userId,
          ...metadata,
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}