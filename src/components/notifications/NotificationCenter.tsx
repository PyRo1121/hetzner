'use client';

import { useEffect, useState } from 'react';

import { Bell, Check, Monitor, Settings, Trash2, Volume2 } from 'lucide-react';

import {
  notificationService,
  type AlertConfig,
  type NotificationConfig,
} from '@/lib/services/notification.service';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
  const [alertConfigs, setAlertConfigs] = useState<Map<string, AlertConfig>>(new Map());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setNotifications(notificationService.getNotifications());
      const configs = new Map<string, AlertConfig>();
      ['price', 'pvp', 'guild', 'arbitrage'].forEach((type) => {
        configs.set(type, notificationService.getAlertConfig(type as any));
      });
      setAlertConfigs(configs);
    };

    loadData();

    // Listen for new notifications
    const handleNotification = (event: CustomEvent) => {
      setNotifications((prev) => [event.detail, ...prev]);
    };

    window.addEventListener('albion-notification', handleNotification as EventListener);
    return () =>
      window.removeEventListener('albion-notification', handleNotification as EventListener);
  }, []);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    notificationService.clearNotifications();
    setNotifications([]);
  };

  const handleConfigChange = (type: string, config: Partial<AlertConfig>) => {
    notificationService.updateAlertConfig(type as any, config);
    setAlertConfigs((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(type) ?? {
        type: type as any,
        enabled: true,
        sound: true,
        browser: true,
      };
      newMap.set(type, { ...existing, ...config });
      return newMap;
    });
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price':
        return '📈';
      case 'pvp':
        return '⚔️';
      case 'guild':
        return '🏰';
      case 'arbitrage':
        return '💰';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-lg border border-albion-gray-700 bg-albion-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-albion-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-neon-blue" />
              {unreadCount > 0 && (
                <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-neon-red">
                  <span className="text-xs font-bold text-white">{unreadCount}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              <p className="text-albion-gray-400 text-sm">{notifications.length} total</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-albion-gray-400 rounded-lg p-2 transition-colors hover:bg-albion-gray-800 hover:text-white"
              title="Notification Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-albion-gray-400 rounded-lg p-2 transition-colors hover:bg-albion-gray-800 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {showSettings ? (
            <NotificationSettings
              configs={alertConfigs}
              onConfigChange={handleConfigChange}
              onBack={() => setShowSettings(false)}
            />
          ) : (
            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAll}
              formatTime={formatTime}
              getNotificationIcon={getNotificationIcon}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  formatTime,
  getNotificationIcon,
}: {
  notifications: NotificationConfig[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  formatTime: (timestamp: number) => string;
  getNotificationIcon: (type: string) => string;
}) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-albion-gray-500">
        <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>No notifications yet</p>
        <p className="mt-2 text-sm">Enable alerts to get notified of important events</p>
      </div>
    );
  }

  return (
    <div>
      {/* Actions */}
      <div className="border-b border-albion-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-2 rounded-lg bg-neon-blue px-3 py-1.5 text-sm text-white transition-colors hover:bg-neon-blue/80"
          >
            <Check className="h-4 w-4" />
            Mark All Read
          </button>
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 rounded-lg bg-neon-red px-3 py-1.5 text-sm text-white transition-colors hover:bg-neon-red/80"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="divide-y divide-albion-gray-700">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 transition-colors hover:bg-albion-gray-800/50 ${
              !notification.read ? 'bg-albion-gray-800/30' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h4
                    className={`font-medium ${!notification.read ? 'text-white' : 'text-albion-gray-300'}`}
                  >
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs text-neon-blue hover:text-neon-blue/80"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
                <p
                  className={`text-sm ${!notification.read ? 'text-albion-gray-300' : 'text-albion-gray-400'}`}
                >
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-albion-gray-500">
                  {formatTime(notification.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationSettings({
  configs,
  onConfigChange,
  onBack,
}: {
  configs: Map<string, AlertConfig>;
  onConfigChange: (type: string, config: Partial<AlertConfig>) => void;
  onBack: () => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-albion-gray-400 rounded-lg p-2 transition-colors hover:bg-albion-gray-800 hover:text-white"
        >
          ←
        </button>
        <div>
          <h3 className="text-lg font-bold text-white">Alert Settings</h3>
          <p className="text-albion-gray-400 text-sm">Configure notification preferences</p>
        </div>
      </div>

      <div className="space-y-4">
        {Array.from(configs.entries()).map(([type, config]) => (
          <div
            key={type}
            className="rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {type === 'price' ? '📈' : type === 'pvp' ? '⚔️' : type === 'guild' ? '🏰' : '💰'}
                </span>
                <div>
                  <h4 className="font-medium capitalize text-white">{type} Alerts</h4>
                  <p className="text-albion-gray-400 text-sm">
                    {type === 'price'
                      ? 'Price changes and arbitrage opportunities'
                      : type === 'pvp'
                        ? 'PvP kills and battle events'
                        : type === 'guild'
                          ? 'Guild activities and achievements'
                          : 'Arbitrage opportunities and profit alerts'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => onConfigChange(type, { enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-albion-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-neon-blue peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue/25" />
                <span className="sr-only">Enable {type} notifications</span>
              </label>
            </div>

            {config.enabled ? (
              <div className="space-y-3 border-t border-albion-gray-700 pt-3">
                {type === 'price' && (
                  <div>
                    <label
                      htmlFor={`${type}-threshold`}
                      className="text-albion-gray-400 mb-2 block text-sm"
                    >
                      Minimum Price Change (%)
                    </label>
                    <input
                      id={`${type}-threshold`}
                      type="number"
                      value={config.threshold ?? 0}
                      onChange={(e) => onConfigChange(type, { threshold: Number(e.target.value) })}
                      className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-3 py-2 text-sm text-white"
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="text-albion-gray-400 h-4 w-4" />
                    <span className="text-albion-gray-400 text-sm">Sound Alerts</span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={config.sound}
                      onChange={(e) => onConfigChange(type, { sound: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-albion-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-neon-green peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-green/25" />
                    <span className="sr-only">Enable sound alerts for {type} notifications</span>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="text-albion-gray-400 h-4 w-4" />
                    <span className="text-albion-gray-400 text-sm">Browser Notifications</span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={config.browser}
                      onChange={(e) => onConfigChange(type, { browser: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-albion-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-neon-purple peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-purple/25" />
                    <span className="sr-only">Enable browser notifications for {type} alerts</span>
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
