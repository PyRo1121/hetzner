'use client';

import { useState, useRef, useEffect } from 'react';

import { gsap } from 'gsap';
import { Info } from 'lucide-react';

interface NarrativeTooltipProps {
  title: string;
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function NarrativeTooltip({
  title,
  content,
  children,
  position = 'top',
}: NarrativeTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!tooltipRef.current) {return;}

    if (isVisible) {
      // Entrance animation
      gsap.fromTo(
        tooltipRef.current,
        {
          opacity: 0,
          scale: 0.9,
          y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
          x: position === 'left' ? 10 : position === 'right' ? -10 : 0,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          x: 0,
          duration: 0.3,
          ease: 'back.out(1.7)',
        }
      );
    } else {
      // Exit animation
      gsap.to(tooltipRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.2,
        ease: 'power2.in',
      });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children || (
        <button className="rounded-full p-1 text-albion-gray-500 transition-colors hover:text-neon-blue">
          <Info className="h-4 w-4" />
        </button>
      )}

      {/* Tooltip */}
      {isVisible ? <div
          ref={tooltipRef}
          className={`absolute z-50 w-64 ${positionClasses[position]}`}
          style={{ opacity: 0 }}
        >
          <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-4 shadow-2xl">
            {/* Arrow */}
            <div
              className={`absolute h-2 w-2 rotate-45 border-albion-gray-700 bg-albion-gray-900 ${
                position === 'top'
                  ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r'
                  : position === 'bottom'
                  ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t'
                  : position === 'left'
                  ? 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t'
                  : 'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l'
              }`}
            />

            {/* Content */}
            <div className="relative">
              <h4 className="mb-2 font-semibold text-neon-blue">{title}</h4>
              <p className="text-sm leading-relaxed text-albion-gray-300">{content}</p>
            </div>
          </div>
        </div> : null}
    </div>
  );
}
