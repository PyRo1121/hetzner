/**
 * Health Check Endpoint for Kubernetes
 * Used by liveness and readiness probes
 */

import { NextResponse } from 'next/server';

import { getRedisClient } from '@/lib/redis/client';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

/**
 * GET /api/health
 * Returns health status of the application
 */
export async function GET() {
  const startTime = Date.now();

  // Check database
  let databaseStatus: 'up' | 'down' = 'down';
  try {
    const { error } = await supabase.from('ao_items').select('id').limit(1);
    databaseStatus = error ? 'down' : 'up';
  } catch {
    databaseStatus = 'down';
  }

  // Check Redis
  let redisStatus: 'up' | 'down' = 'down';
  try {
    const redis = getRedisClient();
    await redis.ping();
    redisStatus = 'up';
  } catch {
    redisStatus = 'down';
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memPercentage = (usedMem / totalMem) * 100;

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (databaseStatus === 'up' && redisStatus === 'up') {
    overallStatus = 'healthy';
  } else if (databaseStatus === 'up' || redisStatus === 'up') {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: databaseStatus,
      redis: redisStatus,
    },
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round(memPercentage),
    },
  };

  const responseTime = Date.now() - startTime;

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 :
                     overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(
    { ...health, responseTime },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

/**
 * HEAD /api/health
 * Lightweight health check (no body)
 */
export async function HEAD() {
  try {
    // Quick database check
    const { error } = await supabase.from('ao_items').select('id').limit(1);

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
