'use client';

import { useEffect, useState } from 'react';

interface RuneGlowProps {
  intensity?: number; // 0-1
  color?: string; // hex color
  size?: number; // glow size in pixels
  className?: string;
  children?: React.ReactNode;
}

export function RuneGlow({
  intensity = 0.5,
  color = '#00d4ff',
  size = 20,
  className = '',
  children,
}: RuneGlowProps) {
  const [supportsHoudini, setSupportsHoudini] = useState(false);

  useEffect(() => {
    // Check for CSS Paint API support
    if (typeof window !== 'undefined' && 'paintWorklet' in CSS) {
      // Register the worklet
      // @ts-expect-error - CSS Paint API not in TypeScript definitions yet
      CSS.paintWorklet.addModule('/worklets/rune-glow.js')
        .then(() => {
          setSupportsHoudini(true);
        })
        .catch((error: Error) => {
          console.warn('Failed to load Houdini worklet:', error);
          setSupportsHoudini(false);
        });
    }
  }, []);

  // Houdini-based glow (Chrome/Edge)
  if (supportsHoudini) {
    return (
      <div
        className={`relative ${className}`}
        style={{
          // @ts-expect-error - CSS Houdini custom properties
          '--glow-intensity': intensity,
          '--glow-color': color,
          '--glow-size': `${size}px`,
          background: 'paint(rune-glow)',
        }}
      >
        {children}
      </div>
    );
  }

  // Fallback glow using CSS (all browsers)
  return (
    <div className={`relative ${className}`}>
      {/* Glow layers */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg blur-xl"
        style={{
          background: `radial-gradient(circle, ${color}${Math.round(intensity * 128).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          opacity: intensity,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-lg blur-2xl"
        style={{
          background: `radial-gradient(circle, ${color}${Math.round(intensity * 64).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          opacity: intensity * 0.6,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Hook to get volatility-based glow intensity
 * Maps volatility percentage to glow intensity (0-1)
 */
export function useVolatilityGlow(volatility: number): {
  intensity: number;
  color: string;
} {
  // Normalize volatility (0-100) to intensity (0-1)
  const intensity = Math.min(volatility / 100, 1);

  // Color based on volatility level
  let color = '#00d4ff'; // Low volatility (blue)
  if (volatility > 70) {
    color = '#ff0080'; // High volatility (pink/red)
  } else if (volatility > 40) {
    color = '#ffd700'; // Medium volatility (gold)
  }

  return { intensity, color };
}
