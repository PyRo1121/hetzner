'use client';

import { useState } from 'react';

import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

import { RuneGlow, useVolatilityGlow } from '@/components/effects/rune-glow';

export function RuneGlowDemo() {
  const [volatility, setVolatility] = useState(50);
  const { intensity, color } = useVolatilityGlow(volatility);

  return (
    <div className="space-y-8 rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-8">
      <div>
        <h3 className="mb-4 text-2xl font-bold text-white">Procedural Rune Glow Effect</h3>
        <p className="text-albion-gray-500">
          CSS Houdini-powered glow effects that respond to data volatility. Automatically falls back
          to CSS gradients on unsupported browsers.
        </p>
      </div>

      {/* Volatility Slider */}
      <div>
        <label htmlFor="volatility-slider" className="mb-2 block text-sm font-medium text-white">
          Market Volatility: {volatility}%
        </label>
        <input
          id="volatility-slider"
          type="range"
          min="0"
          max="100"
          value={volatility}
          onChange={(e) => setVolatility(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-albion-gray-700"
        />
        <div className="mt-2 flex justify-between text-xs text-albion-gray-500">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Glow Examples */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Low Volatility */}
        <RuneGlow intensity={0.3} color="#00d4ff" size={15}>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-neon-blue/30 bg-albion-gray-800 p-6">
            <TrendingDown className="h-8 w-8 text-neon-blue" />
            <div className="text-center">
              <div className="text-sm text-albion-gray-500">Low Volatility</div>
              <div className="text-2xl font-bold text-white">Stable</div>
            </div>
          </div>
        </RuneGlow>

        {/* Medium Volatility */}
        <RuneGlow intensity={0.6} color="#ffd700" size={20}>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-neon-gold/30 bg-albion-gray-800 p-6">
            <Activity className="h-8 w-8 text-neon-gold" />
            <div className="text-center">
              <div className="text-sm text-albion-gray-500">Medium Volatility</div>
              <div className="text-2xl font-bold text-white">Active</div>
            </div>
          </div>
        </RuneGlow>

        {/* High Volatility */}
        <RuneGlow intensity={0.9} color="#ff0080" size={25}>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-neon-purple/30 bg-albion-gray-800 p-6">
            <TrendingUp className="h-8 w-8 text-neon-purple" />
            <div className="text-center">
              <div className="text-sm text-albion-gray-500">High Volatility</div>
              <div className="text-2xl font-bold text-white">Volatile</div>
            </div>
          </div>
        </RuneGlow>
      </div>

      {/* Dynamic Example */}
      <div>
        <h4 className="mb-4 text-lg font-semibold text-white">Dynamic Glow (Based on Slider)</h4>
        <RuneGlow intensity={intensity} color={color} size={intensity * 30}>
          <div className="flex items-center justify-between rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-6">
            <div>
              <div className="text-sm text-albion-gray-500">Current Market State</div>
              <div className="text-3xl font-bold text-white">
                {volatility < 30 ? 'Calm' : volatility < 70 ? 'Active' : 'Chaotic'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-albion-gray-500">Volatility</div>
              <div className="text-3xl font-bold" style={{ color }}>
                {volatility}%
              </div>
            </div>
          </div>
        </RuneGlow>
      </div>

      {/* Technical Info */}
      <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-4">
        <h5 className="mb-2 text-sm font-semibold text-white">Technical Details</h5>
        <ul className="space-y-1 text-xs text-albion-gray-500">
          <li>• Uses CSS Houdini Paint API when available (Chrome, Edge)</li>
          <li>• Automatic fallback to CSS radial gradients (all browsers)</li>
          <li>• Real-time intensity adjustment based on data volatility</li>
          <li>• Hardware-accelerated rendering for 60fps performance</li>
        </ul>
      </div>
    </div>
  );
}
