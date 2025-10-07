/**
 * Mobile-optimized components and utilities
 * Enhanced touch interactions and responsive design
 */

import { useState } from 'react';

// Touch feedback utilities
export const useTouchFeedback = () => {
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    target.style.transform = 'scale(0.98)';
    target.style.transition = 'transform 0.1s ease-out';
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    target.style.transform = 'scale(1)';
  };

  return { handleTouchStart, handleTouchEnd };
};

// Mobile-optimized modal
export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-hidden rounded-t-2xl bg-albion-gray-900 shadow-2xl ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-albion-gray-700 p-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-albion-gray-400 rounded-lg p-2 transition-colors hover:bg-albion-gray-800 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Mobile-optimized card grid
export function MobileCardGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {/* Desktop: 4 columns */}
      <div className="hidden lg:grid lg:grid-cols-4">{children}</div>

      {/* Tablet: 3 columns */}
      <div className="hidden md:grid md:grid-cols-3 lg:hidden">{children}</div>

      {/* Mobile: 2 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}

// Mobile-optimized table
export function MobileTable({
  headers,
  rows,
  className = '',
}: {
  headers: string[];
  rows: React.ReactNode[][];
  className?: string;
}) {
  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden md:block ${className}`}>
        <table className="w-full">
          <thead className="bg-albion-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="text-albion-gray-400 px-4 py-3 text-left text-sm font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-albion-gray-800">
            {rows.map((row, index) => (
              <tr key={index} className="transition-colors hover:bg-albion-gray-800/50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-sm text-white">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="${className} space-y-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={index}
            className="rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {headers.slice(1).map((header, cellIndex) => (
                <div key={cellIndex}>
                  <div className="text-albion-gray-400 mb-1 text-xs">{header}</div>
                  <div className="text-sm font-medium text-white">{row[cellIndex + 1]}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Touch-optimized button
export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const { handleTouchStart, handleTouchEnd } = useTouchFeedback();

  const baseClasses = 'rounded-lg font-medium transition-all duration-200 active:scale-95';

  const variantClasses = {
    primary: 'bg-neon-blue text-white hover:bg-neon-blue/80',
    secondary: 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white',
    danger: 'bg-neon-red text-white hover:bg-neon-red/80',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      className={` ${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className} `}
      {...props}
    >
      {children}
    </button>
  );
}

// Swipeable container for mobile
export function SwipeableContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = '',
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}) {
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startX || !startY) {
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Only consider horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setStartX(null);
    setStartY(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`touch-pan-y ${className}`}
    >
      {children}
    </div>
  );
}

// Mobile-optimized tabs
export function MobileTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-3 font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-neon-blue text-white'
              : 'text-albion-gray-400 bg-albion-gray-800 hover:bg-albion-gray-700 hover:text-white'
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
}

// Responsive container with mobile-first breakpoints
export function ResponsiveContainer({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
}: {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}) {
  return (
    <div
      className={` ${mobileClassName} md:${tabletClassName} lg:${desktopClassName} ${className} `}
    >
      {children}
    </div>
  );
}
