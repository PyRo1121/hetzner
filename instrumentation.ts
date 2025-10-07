/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 */

export async function register() {
  // Polyfill 'self' for server-side code that expects browser globals
  if (typeof self === 'undefined') {
    (globalThis as any).self = globalThis;
  }

  // Server-side performance monitoring
  if (process.env.NODE_ENV === 'production') {
    console.log('[Instrumentation] Server started');
    
    // Track server startup time
    const startTime = performance.now();
    
    // Initialize any server-side monitoring
    // Example: Sentry, DataDog, etc.
    
    const endTime = performance.now();
    console.log(`[Instrumentation] Initialized in ${Math.round(endTime - startTime)}ms`);
  }
}
