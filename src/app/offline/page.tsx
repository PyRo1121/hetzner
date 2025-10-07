'use client';

import Link from 'next/link';

import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-albion-gray-950 px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-albion-gray-900 p-6">
            <WifiOff className="h-16 w-16 text-neon-blue" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold text-white">You&apos;re Offline</h1>

        {/* Description */}
        <p className="mb-8 max-w-md text-lg text-albion-gray-500">
          It looks like you&apos;ve lost your internet connection. Some features may be unavailable, but
          you can still access cached data.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className="btn-forge flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-6 py-3 font-semibold text-white transition-all hover:border-neon-blue hover:bg-albion-gray-800"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>

        {/* Cached Data Info */}
        <div className="mt-12 rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Offline Features</h2>
          <ul className="space-y-2 text-left text-sm text-albion-gray-500">
            <li className="flex items-start gap-2">
              <span className="text-neon-green">✓</span>
              <span>View cached market prices and historical data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-green">✓</span>
              <span>Access saved trading calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-green">✓</span>
              <span>Browse previously viewed PvP analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-albion-gray-700">✗</span>
              <span>Real-time updates and live data</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
