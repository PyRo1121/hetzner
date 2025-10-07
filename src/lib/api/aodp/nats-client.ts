/**
 * AODP NATS Client for Real-Time Market Data
 * Subscribes to: goldprices.ingest, marketorders.deduped
 * Rate limits: 180 requests/minute, 300 requests/5 minutes
 */

import { connect, type NatsConnection, StringCodec, type Subscription } from 'nats';
import { z } from 'zod';

// Zod schemas for NATS message validation
const GoldPriceMessageSchema = z.object({
  Price: z.number(),
  Timestamp: z.string(),
});

const MarketOrderMessageSchema = z.object({
  Id: z.number(),
  ItemTypeId: z.string(),
  LocationId: z.number(),
  QualityLevel: z.number(),
  EnchantmentLevel: z.number(),
  UnitPriceSilver: z.number(),
  Amount: z.number(),
  AuctionType: z.string(),
  Expires: z.string(),
});

export type GoldPriceMessage = z.infer<typeof GoldPriceMessageSchema>;
export type MarketOrderMessage = z.infer<typeof MarketOrderMessageSchema>;

export class AODPNatsClient {
  private connection: NatsConnection | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private codec = StringCodec();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private server: string = 'nats://public:thenewalbiondata@www.albion-online-data.com:4222'
  ) {}

  /**
   * Connect to NATS server
   */
  async connect(): Promise<void> {
    try {
      this.connection = await connect({
        servers: [this.server],
        reconnect: true,
        maxReconnectAttempts: this.maxReconnectAttempts,
        reconnectTimeWait: 2000, // 2 seconds
      });

      console.log('✅ Connected to AODP NATS server');

      // Handle connection events
      (async () => {
        if (!this.connection) {return;}
        
        for await (const status of this.connection.status()) {
          console.log(`NATS status: ${status.type}`);
          
          if (status.type === 'disconnect') {
            console.warn('⚠️ Disconnected from NATS server');
          } else if (status.type === 'reconnect') {
            console.log('🔄 Reconnected to NATS server');
            this.reconnectAttempts = 0;
          } else if (status.type === 'reconnecting') {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts})`);
          }
        }
      })();
    } catch (error) {
      console.error('❌ Failed to connect to NATS:', error);
      throw error;
    }
  }

  /**
   * Subscribe to gold prices
   */
  async subscribeToGoldPrices(
    callback: (message: GoldPriceMessage) => void
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to NATS server');
    }

    const subject = 'goldprices.ingest';
    
    if (this.subscriptions.has(subject)) {
      console.warn(`Already subscribed to ${subject}`);
      return;
    }

    const subscription = this.connection.subscribe(subject);
    this.subscriptions.set(subject, subscription);

    (async () => {
      for await (const msg of subscription) {
        try {
          const data = JSON.parse(this.codec.decode(msg.data));
          const validated = GoldPriceMessageSchema.parse(data);
          callback(validated);
        } catch (error) {
          console.error('Error parsing gold price message:', error);
        }
      }
    })();

    console.log(`📡 Subscribed to ${subject}`);
  }

  /**
   * Subscribe to market orders
   */
  async subscribeToMarketOrders(
    callback: (message: MarketOrderMessage) => void
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to NATS server');
    }

    const subject = 'marketorders.deduped';
    
    if (this.subscriptions.has(subject)) {
      console.warn(`Already subscribed to ${subject}`);
      return;
    }

    const subscription = this.connection.subscribe(subject);
    this.subscriptions.set(subject, subscription);

    (async () => {
      for await (const msg of subscription) {
        try {
          const data = JSON.parse(this.codec.decode(msg.data));
          const validated = MarketOrderMessageSchema.parse(data);
          callback(validated);
        } catch (error) {
          console.error('Error parsing market order message:', error);
        }
      }
    })();

    console.log(`📡 Subscribed to ${subject}`);
  }

  /**
   * Unsubscribe from a subject
   */
  async unsubscribe(subject: string): Promise<void> {
    const subscription = this.subscriptions.get(subject);
    if (subscription) {
      await subscription.unsubscribe();
      this.subscriptions.delete(subject);
      console.log(`🔕 Unsubscribed from ${subject}`);
    }
  }

  /**
   * Unsubscribe from all subjects
   */
  async unsubscribeAll(): Promise<void> {
    for (const [subject, subscription] of this.subscriptions.entries()) {
      await subscription.unsubscribe();
      console.log(`🔕 Unsubscribed from ${subject}`);
    }
    this.subscriptions.clear();
  }

  /**
   * Disconnect from NATS server
   */
  async disconnect(): Promise<void> {
    await this.unsubscribeAll();
    
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      console.log('👋 Disconnected from NATS server');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null && !this.connection.isClosed();
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Export singleton instance
export const aodpNatsClient = new AODPNatsClient();
