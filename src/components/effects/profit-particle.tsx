'use client';

import { useEffect, useRef } from 'react';

import Lottie, { type LottieRefCurrentProps } from 'lottie-react';

// Simple coin animation data (inline for demonstration)
const coinAnimation = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: 'Coin',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Circle',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 60 }] },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [120, 120, 100] }, { t: 30, s: [120, 120, 100], e: [100, 100, 100] }, { t: 60 }] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'el',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [40, 40] },
            },
            {
              ty: 'fl',
              c: { a: 0, k: [1, 0.84, 0, 1] },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
  ],
};

interface ProfitParticleProps {
  show: boolean;
  size?: number;
}

export function ProfitParticle({ show, size = 100 }: ProfitParticleProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (show && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [show]);

  if (!show) {return null;}

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <Lottie
        lottieRef={lottieRef}
        animationData={coinAnimation}
        loop
        style={{ width: size, height: size }}
      />
    </div>
  );
}

/**
 * CSS-based particle effect (fallback/alternative)
 */
export function CSSParticles({ show }: { show: boolean }) {
  if (!show) {return null;}

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${20 + i * 15}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${2 + i * 0.5}s`,
          }}
        >
          <div className="h-2 w-2 rounded-full bg-neon-gold opacity-60 blur-sm" />
        </div>
      ))}
    </div>
  );
}
