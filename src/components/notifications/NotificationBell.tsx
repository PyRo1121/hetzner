'use client';

import { useEffect, useState } from 'react';

import { Bell } from 'lucide-react';

import { notificationService } from '@/lib/services/notification.service';

import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(notificationService.getUnreadCount());
    };

    updateCount();

    // Listen for new notifications
    const handleNotification = () => {
      updateCount();
    };

    window.addEventListener('albion-notification', handleNotification);

    // Update count every minute
    const interval = setInterval(updateCount, 60000);

    return () => {
      window.removeEventListener('albion-notification', handleNotification);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 text-albion-gray-400 hover:text-white hover:bg-albion-gray-800 rounded-lg transition-colors ${className}`}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
