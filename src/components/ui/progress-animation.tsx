'use client';

import { useEffect, useRef } from 'react';

import { gsap } from 'gsap';
import { X } from 'lucide-react';

interface ProgressAnimationProps {
  progress: number; // 0-100
  label?: string;
  onCancel?: () => void;
  showPercentage?: boolean;
}

export function ProgressAnimation({
  progress,
  label = 'Processing...',
  onCancel,
  showPercentage = true,
}: ProgressAnimationProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLDivElement>(null);
  const prevProgress = useRef(0);

  useEffect(() => {
    if (!progressBarRef.current) {return;}

    // Animate progress bar with GSAP
    gsap.to(progressBarRef.current, {
      width: `${progress}%`,
      duration: 0.5,
      ease: 'power2.out',
    });

    // Animate percentage counter
    if (percentageRef.current && showPercentage) {
      gsap.to(percentageRef.current, {
        innerText: progress,
        duration: 0.5,
        snap: { innerText: 1 },
        ease: 'power2.out',
      });
    }

    // Pulse effect when progress increases
    if (progress > prevProgress.current) {
      gsap.fromTo(
        progressBarRef.current,
        { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        {
          boxShadow: '0 0 0px rgba(59, 130, 246, 0)',
          duration: 0.6,
          ease: 'power2.out',
        }
      );
    }

    prevProgress.current = progress;
  }, [progress, showPercentage]);

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-white">{label}</span>
            {showPercentage ? <span ref={percentageRef} className="text-sm font-bold text-neon-blue">
                0%
              </span> : null}
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 overflow-hidden rounded-full bg-albion-gray-800">
            <div
              ref={progressBarRef}
              className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-green transition-all"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {onCancel ? <button
            onClick={onCancel}
            className="ml-4 rounded-lg p-2 text-albion-gray-500 transition-colors hover:bg-albion-gray-800 hover:text-white"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button> : null}
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-blue"
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
