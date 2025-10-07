/**
 * Live PvP Kills API Route
 * Proxies Gameinfo events with validation, timeout, and rate limiting.
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { RATE_LIMITS, rateLimiter } from '@/lib/cache/rate-limiter';

const BASE_URLS = {
  Americas: 'https://gameinfo.albiononline.com/api/gameinfo',
  Europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
  Asia: 'https://gameinfo-sgp.albiononline.com/api/gameinfo',
} as const;

type Server = keyof typeof BASE_URLS;

const SUPPORTED_SERVERS: Server[] = ['Americas', 'Europe', 'Asia'];

const QuerySchema = z.object({
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((v) => !Number.isNaN(v), 'limit must be a number')
    .optional(),
  offset: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((v) => !Number.isNaN(v), 'offset must be a number')
    .optional(),
  guildId: z.string().optional(),
  server: z.enum(['Americas', 'Europe', 'Asia']).optional(),
});

const TIMEOUT_MS = Number.parseInt(process.env.GAMEINFO_TIMEOUT_MS ?? '8000', 10);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      limit: searchParams.get('limit') ?? '51',
      offset: searchParams.get('offset') ?? '0',
      guildId: searchParams.get('guildId') ?? undefined,
      server: (searchParams.get('server') as Server | null) ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const limit = Math.max(1, Math.min(parsed.data.limit ?? 51, 51)); // API max is 51
    const offset = Math.max(0, parsed.data.offset ?? 0);
    const guildId = parsed.data.guildId;
    const server: Server =
      parsed.data.server && SUPPORTED_SERVERS.includes(parsed.data.server)
        ? parsed.data.server
        : 'Americas';

    // Route-specific rate limiting using GAMEINFO bucket
    const allowed = await rateLimiter.tryConsume('route:/api/pvp/kills', 1, RATE_LIMITS.GAMEINFO);
    if (!allowed) {
      const remaining = rateLimiter.getRemaining('route:/api/pvp/kills');
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      );
    }

    const base = BASE_URLS[server];
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (guildId) {
      params.set('guildId', guildId);
    }

    const url = `${base}/events?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Gameinfo error: ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Very short cache to smooth intermittent spikes without staling live feed
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
          'X-Source-Server': server,
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message.includes('aborted') ? 504 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
