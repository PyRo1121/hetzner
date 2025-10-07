'use client';

import { useEffect, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { CommandPalette } from '@/components/layout/command-palette';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ToastProvider } from '@/components/notifications/toast-provider';
import { notificationService } from '@/lib/services/notification.service';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Initialize background sync ONCE on app load
  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      if (!mounted) {
        return;
      }

      try {
        // Only run sync once per session
        if (typeof window !== 'undefined' && !window.sessionStorage.getItem('sync_initialized')) {
          const response = await fetch('/api/sync', { method: 'POST' });
          const result = await response.json();

          if (result.success) {
            window.sessionStorage.setItem('sync_initialized', 'true');
          } else {
            console.error('[App] Sync failed:', result.error);
          }
        }

        // Preload item names (cached after first load)
        const { preloadItemNames } = await import('@/lib/utils/item-names');
        await preloadItemNames();

        // Initialize notification service
        await notificationService.initialize();
      } catch (error) {
        console.error('[App] Init error:', error);
      }
    };

    void initApp();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="relative">
          <CommandPalette />
          <NotificationBell className="fixed right-4 top-4 z-40" />
        </div>
        {children}
      </ToastProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
