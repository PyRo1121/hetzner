/**
 * Loot Value API Route
 * On-demand loot estimation for a specific kill
 * Only called when user clicks to view kill details
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { lootValueService } from '@/lib/services';

export const dynamic = 'force-dynamic';

const InventoryItemSchema = z.object({
  Type: z.string().optional().nullable(),
  Count: z.number().optional().nullable(),
});

const RequestSchema = z.object({
  inventory: z.array(InventoryItemSchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { inventory } = parsed.data;

    // Calculate loot value using in-memory price cache
    const estimation = await lootValueService.estimateLootValue(inventory);

    return NextResponse.json(
      {
        success: true,
        data: estimation,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[API] Loot Value Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate loot value',
      },
      { status: 500 }
    );
  }
}
