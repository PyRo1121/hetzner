import { NextResponse } from 'next/server';

import { Buffer } from 'buffer';

import * as Sentry from '@sentry/nextjs';

import { RATE_LIMITS, rateLimiter } from '@/lib/cache/rate-limiter';
import { getCache, setCache } from '@/lib/cache/redis-cache.server';
import { getItemImageUrl } from '@/lib/storage/item-images';

const RENDER_BASE_URL = 'https://render.albiononline.com/v1/item';
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const STALE_WHILE_REVALIDATE_SECONDS = 24 * 60 * 60; // 24 hours
const SUPABASE_TIMEOUT_MS = Number.parseInt(process.env.SUPABASE_IMAGE_TIMEOUT_MS ?? '3000', 10);
const ROUTE_RATE_LIMIT = {
  capacity: Number.parseInt(process.env.RENDER_ROUTE_LIMIT_CAPACITY ?? String(RATE_LIMITS.DEFAULT.capacity), 10),
  refillRate: Number.parseInt(process.env.RENDER_ROUTE_LIMIT_REFILL_RATE ?? String(RATE_LIMITS.DEFAULT.refillRate), 10),
};

async function fetchRenderAsset(params: URLSearchParams): Promise<Response> {
  const itemId = params.get('itemId') ?? '';
  const url = `${RENDER_BASE_URL}/${encodeURIComponent(itemId)}.png?${params.toString()}`;

  return fetch(url, {
    headers: {
      Accept: 'image/png,image/webp,image/avif,*/*',
    },
    next: { revalidate: CACHE_TTL_SECONDS },
  });
}

function buildCacheKey(params: URLSearchParams): string {
  const sorted = new URLSearchParams();
  Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => sorted.append(key, value));

  return `render:item:${sorted.toString()}`;
}

function normalizeParam(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed.toString();
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');

  if (!itemId) {
    return NextResponse.json({ error: 'Missing itemId parameter' }, { status: 400 });
  }

  const quality = Number.parseInt(normalizeParam(searchParams.get('quality'), '1'), 10);
  const size = Number.parseInt(normalizeParam(searchParams.get('size'), '128'), 10);
  const enchantment = Number.parseInt(normalizeParam(searchParams.get('enchantment'), '0'), 10);

  // Normalize params and build a consistent cache key up-front
  const normalizedParams = new URLSearchParams();
  normalizedParams.set('itemId', itemId);
  normalizedParams.set('quality', quality.toString());
  normalizedParams.set('size', size.toString());
  normalizedParams.set('enchantment', enchantment.toString());
  const cacheKey = buildCacheKey(normalizedParams);

  // Route-level rate limiting to protect against traffic spikes
  const routeLimited = await rateLimiter.tryConsume('route:/api/render/item', 1, ROUTE_RATE_LIMIT);
  if (!routeLimited) {
    const remaining = rateLimiter.getRemaining('route:/api/render/item');
    return NextResponse.json(
      { error: 'Render route rate limit exceeded' },
      { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  }

  // Serve directly from cache if available (eliminates redundant upstream calls)
  const cached = await getCache<{ contentType: string; base64: string }>(cacheKey);
  if (cached?.base64 && cached.contentType) {
    const buffer = Buffer.from(cached.base64, 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
        'X-Cache': 'HIT',
        'X-Source': 'cache',
      },
    });
  }

  // Try to get from Supabase Storage first (fastest!)
  try {
    const supabaseUrl = await getItemImageUrl(itemId, quality, enchantment, size);

    if (supabaseUrl) {
      // Proxy Supabase image with timeout and graceful fallback
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
      try {
        const supRes = await fetch(supabaseUrl, {
          headers: { Accept: 'image/png,image/webp,image/avif,*/*' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (supRes.ok) {
          const arrayBuffer = await supRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = supRes.headers.get('Content-Type') ?? 'image/png';
          // Write-through cache for successful Supabase responses
          await setCache(cacheKey, { contentType, base64: buffer.toString('base64') }, CACHE_TTL_SECONDS);

          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, immutable`,
              'X-Cache': 'MISS',
              'X-Source': 'supabase',
            },
          });
        }
      } catch (err) {
        console.warn('[Render] Supabase image fetch failed or timed out, falling back:', err);
      }
    }
  } catch (error) {
    console.warn('[Render] Supabase storage failed, falling back to Albion API:', error);
  }

  // Additional limiter for external API fallback to protect upstream service
  const fallbackAllowed = await rateLimiter.tryConsume('render:item:fallback', 1, RATE_LIMITS.DEFAULT);
  if (!fallbackAllowed) {
    const remaining = rateLimiter.getRemaining('render:item:fallback');
    Sentry.captureMessage('Render proxy fallback rate limited', {
      level: 'warning',
      extra: { remainingTokens: remaining },
    });
    return NextResponse.json(
      { error: 'Render fallback rate limit exceeded' },
      { status: 429, headers: { 'X-RateLimit-Remaining-Fallback': remaining.toString() } }
    );
  }

  try {
    const response = await fetchRenderAsset(normalizedParams);

    if (!response.ok) {
      Sentry.captureMessage('Render service returned non-OK response', {
        level: 'warning',
        extra: {
          status: response.status,
          statusText: response.statusText,
          itemId,
          params: normalizedParams.toString(),
        },
      });
      return NextResponse.json(
        { error: `Render service error: ${response.status}` },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('Content-Type') ?? 'image/png';

    await setCache(cacheKey, { contentType, base64: buffer.toString('base64') }, CACHE_TTL_SECONDS);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
        'X-Cache': 'MISS',
        'X-Source': 'albion',
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: '/api/render/item' },
      extra: {
        itemId,
        params: normalizedParams.toString(),
      },
    });
    return NextResponse.json({ error: 'Failed to fetch render asset' }, { status: 502 });
  }
}
