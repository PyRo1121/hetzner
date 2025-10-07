import { describe, it, expect, vi } from 'vitest';
import { AODPClient } from './client';

describe('AODPClient', () => {
  it('should initialize with default server', () => {
    const client = new AODPClient();
    expect(client.getServer()).toBe('Americas');
  });

  it('should change server', () => {
    const client = new AODPClient();
    client.setServer('Europe');
    expect(client.getServer()).toBe('Europe');
  });

  it('should construct correct price URL', async () => {
    const client = new AODPClient();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    await client.getPrices('T4_BAG', {
      locations: 'Caerleon',
      qualities: '1',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('T4_BAG'),
      expect.any(Object)
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('locations=Caerleon'),
      expect.any(Object)
    );

    fetchSpy.mockRestore();
  });
});
