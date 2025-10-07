'use client';

/**
 * Dialog/Modal Component
 * Simple modal implementation for displaying detailed information
 */

import { useEffect, useRef } from 'react';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) {return null;}

  // Render dialog in a portal at document.body level to escape container constraints
  if (typeof document === 'undefined') {return null;}

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm -z-10"
      />
      
      {/* Dialog Content */}
      <div
        ref={dialogRef}
        className="relative z-10 max-h-[90vh] w-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div 
      className={`mx-auto max-w-4xl rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-6 shadow-2xl ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-albion-gray-700 pb-4">
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-2xl font-bold text-white ${className}`}>
      {children}
    </h2>
  );
}

interface DialogCloseProps {
  onClick?: () => void;
}

export function DialogClose({ onClick }: DialogCloseProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-albion-gray-400 transition-colors hover:bg-albion-gray-800 hover:text-white"
    >
      <X className="h-5 w-5" />
    </button>
  );
}
