import { NextResponse } from 'next/server';

/**
 * Web Vitals Analytics Endpoint
 * Receives and logs Core Web Vitals metrics
 */
export async function POST(request: Request) {
  try {
    const metric = await request.json();

    // Log metric (in production, send to analytics service)
    console.log('[Web Vitals]', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to analytics service (Vercel Analytics, Google Analytics, etc.)
    // Example: await sendToAnalyticsService(metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
