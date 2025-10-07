import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AODPNatsClient } from './nats-client';

// Mock NATS
vi.mock('nats', () => ({
  connect: vi.fn(),
  StringCodec: vi.fn(() => ({
    decode: (data: Uint8Array) => new TextDecoder().decode(data),
    encode: (str: string) => new TextEncoder().encode(str),
  })),
}));

describe('AODPNatsClient', () => {
  let client: AODPNatsClient;

  beforeEach(() => {
    client = new AODPNatsClient();
  });

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect();
    }
  });

  it('should create client instance', () => {
    expect(client).toBeInstanceOf(AODPNatsClient);
    expect(client.isConnected()).toBe(false);
  });

  it('should track active subscriptions', () => {
    expect(client.getActiveSubscriptions()).toEqual([]);
  });

  it('should handle connection errors gracefully', async () => {
    const { connect } = await import('nats');
    (connect as any).mockRejectedValueOnce(new Error('Connection failed'));

    await expect(client.connect()).rejects.toThrow('Connection failed');
  });
});
